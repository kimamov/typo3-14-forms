<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use T13Forms\Sitepackage\Expression\ClientVariantsEvaluator;
use TYPO3\CMS\Core\Crypto\HashAlgo;
use TYPO3\CMS\Core\Crypto\HashService;
use TYPO3\CMS\Core\Http\JsonResponse;
use TYPO3\CMS\Core\Http\PropagateResponseException;
use TYPO3\CMS\Core\Utility\ArrayUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;
use TYPO3\CMS\Extbase\Configuration\ConfigurationManagerInterface as ExtbaseConfigurationManagerInterface;
use TYPO3\CMS\Extbase\Mvc\ExtbaseRequestParameters;
use TYPO3\CMS\Extbase\Mvc\Request as ExtbaseRequest;
use TYPO3\CMS\Form\Domain\Factory\ArrayFormFactory;
use TYPO3\CMS\Form\Domain\Model\FormElements\FormElementInterface;
use TYPO3\CMS\Form\Mvc\Persistence\FormPersistenceManagerInterface;
use TYPO3\CMS\Frontend\ContentObject\ContentObjectRenderer;
use TYPO3\CMS\Form\Security\HashScope;

/**
 * Intercepts AJAX form submissions (detected via the X-Form-Ajax header)
 * and returns a JSON response with validation results and finisher outcomes
 * instead of rendering a full HTML page.
 */
final class AjaxFormSubmitMiddleware implements MiddlewareInterface
{
    public function __construct(
        private readonly FormPersistenceManagerInterface $formPersistenceManager,
        private readonly HashService $hashService,
        private readonly ArrayFormFactory $formFactory,
        private readonly ExtbaseConfigurationManagerInterface $configurationManager,
    ) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        if (!$this->isAjaxFormRequest($request)) {
            return $handler->handle($request);
        }

        // The RequestHandler at the end of the stack normally sets this global.
        // Since we short-circuit here, components like DefaultSanitizerBuilder
        // that rely on $GLOBALS['TYPO3_REQUEST'] would fail without this.
        $GLOBALS['TYPO3_REQUEST'] = $request;

        try {
            return $this->handleAjaxSubmit($request);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'valid' => false,
                'errors' => ['__global' => [$e->getMessage()]],
                'page' => ['current' => 0, 'total' => 1],
                'finished' => false,
                'redirect' => null,
                'message' => null,
                'state' => '',
            ], 500);
        }
    }

    private function isAjaxFormRequest(ServerRequestInterface $request): bool
    {
        if ($request->getMethod() !== 'POST') {
            return false;
        }

        return $request->getHeaderLine('X-Form-Ajax') === '1';
    }

    private function handleAjaxSubmit(ServerRequestInterface $request): ResponseInterface
    {
        $parsedBody = $request->getParsedBody();
        $formArgs = $parsedBody['tx_form_formframework'] ?? [];
        if (!is_array($formArgs) || $formArgs === []) {
            return new JsonResponse([
                'valid' => false,
                'errors' => ['__global' => ['No form data received.']],
                'page' => ['current' => 0, 'total' => 1],
                'finished' => false,
                'redirect' => null,
                'message' => null,
                'state' => '',
            ], 400);
        }

        $formIdentifier = $this->extractFormIdentifier($formArgs);
        if ($formIdentifier === null) {
            return new JsonResponse([
                'valid' => false,
                'errors' => ['__global' => ['Could not determine form identifier.']],
                'page' => ['current' => 0, 'total' => 1],
                'finished' => false,
                'redirect' => null,
                'message' => null,
                'state' => '',
            ], 400);
        }

        $persistenceIdentifier = $formArgs[$formIdentifier]['__persistenceIdentifier'] ?? '';

        if ($persistenceIdentifier === '') {
            return new JsonResponse([
                'valid' => false,
                'errors' => ['__global' => ['Missing persistence identifier.']],
                'page' => ['current' => 0, 'total' => 1],
                'finished' => false,
                'redirect' => null,
                'message' => null,
                'state' => '',
            ], 400);
        }

        $this->configurationManager->setRequest($request);
        $typoScriptSettings = $this->configurationManager->getConfiguration(
            ExtbaseConfigurationManagerInterface::CONFIGURATION_TYPE_SETTINGS,
            'form',
        );

        $formDefinition = $this->formPersistenceManager->load(
            $persistenceIdentifier,
            $typoScriptSettings,
            $request,
        );
        $formDefinition['persistenceIdentifier'] = $persistenceIdentifier;
        $formDefinition = ArrayUtility::setValueByPath(
            $formDefinition,
            'renderingOptions._originalIdentifier',
            $formDefinition['identifier'],
            '.',
        );

        // The submitted form identifier already includes the content element
        // UID suffix (e.g. "contact-5"). Override the loaded definition's
        // identifier to match so FormRuntime can find its submitted data.
        $formDefinition['identifier'] = $formIdentifier;

        $prototypeName = $formDefinition['prototypeName'] ?? 'standard';

        $extbaseRequest = $this->buildExtbaseRequest($request, $formArgs);
        $builtDefinition = $this->formFactory->build($formDefinition, $prototypeName, $extbaseRequest);
        $formRuntime = $builtDefinition->bind($extbaseRequest);

        $totalPages = count($formRuntime->getPages());
        $currentPage = $formRuntime->getCurrentPage();
        $isAfterLastPage = $currentPage === null;

        /** @var ExtbaseRequestParameters $extbaseParams */
        $extbaseParams = $formRuntime->getRequest()->getAttribute('extbase');
        $validationResult = $extbaseParams->getOriginalRequestMappingResults();

        $rawErrors = $this->flattenErrors($validationResult, $formRuntime->getIdentifier());

        $disabledFields = $this->getClientVariantsDisabledFields($formRuntime);
        $errors = array_diff_key($rawErrors, array_flip($disabledFields));

        $newState = $this->serializeFormState($formRuntime);

        // The EventListener disables conditional elements before validation,
        // so normally isAfterLastPage is correct. As a safety net, if
        // processSubmittedFormValues() reset currentPage because of errors
        // that were ALL from disabled fields, we still treat the form as
        // finished when the submitted __currentPage indicates past-last-page.
        if (!$isAfterLastPage && $errors === [] && $rawErrors !== []) {
            $submittedPage = (int)($formArgs[$formIdentifier]['__currentPage'] ?? 0);
            if ($submittedPage >= $totalPages) {
                $isAfterLastPage = true;
            }
        }

        if ($isAfterLastPage && $errors === []) {
            return $this->handleFinishers($formRuntime, $totalPages, $newState);
        }

        $isValid = $errors === [];
        $currentPageIndex = $currentPage?->getIndex() ?? 0;

        return new JsonResponse([
            'valid' => $isValid,
            'errors' => $errors,
            'page' => ['current' => $currentPageIndex, 'total' => $totalPages],
            'finished' => false,
            'redirect' => null,
            'message' => null,
            'state' => $newState,
        ]);
    }

    private function handleFinishers(
        \TYPO3\CMS\Form\Domain\Runtime\FormRuntime $formRuntime,
        int $totalPages,
        string $state,
    ): ResponseInterface {
        try {
            $output = $formRuntime->render();

            return new JsonResponse([
                'valid' => true,
                'errors' => [],
                'page' => ['current' => $totalPages - 1, 'total' => $totalPages],
                'finished' => true,
                'redirect' => null,
                'message' => is_string($output) && $output !== '' ? $output : null,
                'state' => $state,
            ]);
        } catch (PropagateResponseException $e) {
            $response = $e->getResponse();
            $statusCode = $response->getStatusCode();

            if ($statusCode >= 300 && $statusCode < 400) {
                $redirectUrl = $response->getHeaderLine('Location');
                return new JsonResponse([
                    'valid' => true,
                    'errors' => [],
                    'page' => ['current' => $totalPages - 1, 'total' => $totalPages],
                    'finished' => true,
                    'redirect' => $redirectUrl,
                    'message' => null,
                    'state' => $state,
                ]);
            }

            throw $e;
        }
    }

    /**
     * Finds the form identifier key from the submitted arguments.
     * The form data is nested as tx_form_formframework[formId][...].
     */
    private function extractFormIdentifier(array $formArgs): ?string
    {
        foreach ($formArgs as $key => $value) {
            if (is_array($value)) {
                return (string) $key;
            }
        }
        return null;
    }

    private function buildExtbaseRequest(
        ServerRequestInterface $request,
        array $formArgs,
    ): ExtbaseRequest {
        $extbaseParameters = new ExtbaseRequestParameters();
        $extbaseParameters->setPluginName('Formframework');
        $extbaseParameters->setControllerExtensionName('Form');

        // FormRuntime::isRenderedCached() checks the currentContentObject
        // attribute to decide if it may process submitted values. Without a
        // content object it assumes cached context and ignores POST data.
        // Provide a USER_INT content object so the runtime treats this as
        // an uncached, processable submission.
        $contentObject = GeneralUtility::makeInstance(ContentObjectRenderer::class);
        $contentObject->setUserObjectType(ContentObjectRenderer::OBJECTTYPE_USER_INT);

        $psrRequest = $request
            ->withAttribute('extbase', $extbaseParameters)
            ->withAttribute('currentContentObject', $contentObject);
        $extbaseRequest = new ExtbaseRequest($psrRequest);
        $extbaseRequest = $extbaseRequest->withArguments($formArgs);

        return $extbaseRequest;
    }

    /**
     * Extracts errors from the validation Result into a flat
     * Record<fieldIdentifier, string[]> structure.
     */
    private function flattenErrors(
        \TYPO3\CMS\Extbase\Error\Result $result,
        string $formIdentifier,
    ): array {
        $flattenedErrors = $result->getFlattenedErrors();
        $errors = [];

        foreach ($flattenedErrors as $propertyPath => $errorList) {
            $fieldName = $propertyPath;
            $prefix = $formIdentifier . '.';
            if (str_starts_with($fieldName, $prefix)) {
                $fieldName = substr($fieldName, strlen($prefix));
            }

            $messages = [];
            foreach ($errorList as $error) {
                $messages[] = $error->getMessage();
            }

            if ($messages !== []) {
                $errors[$fieldName] = $messages;
            }
        }

        return $errors;
    }

    private function serializeFormState(
        \TYPO3\CMS\Form\Domain\Runtime\FormRuntime $formRuntime,
    ): string {
        $formState = $formRuntime->getFormState();
        if ($formState === null) {
            return '';
        }

        return $this->hashService->appendHmac(
            base64_encode(serialize($formState)),
            HashScope::FormState->prefix(),
            HashAlgo::SHA3_256,
        );
    }

    /**
     * Determines which fields should be disabled based on clientVariants
     * conditions evaluated against the current submitted form values.
     *
     * @return string[] Identifiers of fields that should be disabled
     */
    private function getClientVariantsDisabledFields(
        \TYPO3\CMS\Form\Domain\Runtime\FormRuntime $formRuntime,
    ): array {
        $formState = $formRuntime->getFormState();
        if ($formState === null) {
            return [];
        }

        $evaluator = new ClientVariantsEvaluator();
        $formValues = [];
        $requestArgs = $formRuntime->getRequest()->getArguments();

        foreach ($formRuntime->getFormDefinition()->getPages() as $page) {
            foreach ($page->getElementsRecursively() as $element) {
                $id = $element->getIdentifier();
                $value = $requestArgs[$id] ?? $formState->getFormValue($id);
                if (is_string($value)) {
                    $formValues[$id] = $value;
                } elseif (is_array($value)) {
                    $formValues[$id] = $value['date'] ?? implode(' ', array_filter($value, 'is_string'));
                } else {
                    $formValues[$id] = (string) ($value ?? '');
                }
            }
        }

        $disabled = [];
        foreach ($formRuntime->getFormDefinition()->getPages() as $page) {
            foreach ($page->getElementsRecursively() as $element) {
                if (!($element instanceof FormElementInterface)) {
                    continue;
                }
                $properties = $element->getProperties();
                $clientVariants = $properties['clientVariants'] ?? null;

                if (!is_array($clientVariants) || $clientVariants === []) {
                    continue;
                }

                $enabled = false;
                foreach ($clientVariants as $variant) {
                    $condition = $variant['condition'] ?? '';
                    $variantEnabled = $variant['enabled'] ?? false;
                    if ($condition !== '' && $variantEnabled === true) {
                        if ($evaluator->evaluate($condition, $formValues)) {
                            $enabled = true;
                            break;
                        }
                    }
                }

                if (!$enabled) {
                    $disabled[] = $element->getIdentifier();
                }
            }
        }

        return $disabled;
    }
}
