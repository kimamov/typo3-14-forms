<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Form\Domain\Model\FormElements\FormElementInterface;
use TYPO3\CMS\Form\Domain\Model\Renderable\AbstractRenderable;
use TYPO3\CMS\Form\Event\AfterCurrentPageIsResolvedEvent;
use T13Forms\Sitepackage\Expression\ClientVariantsEvaluator;

/**
 * Disables form elements whose clientVariants conditions are not met,
 * so TYPO3's FormRuntime skips their validation in mapAndValidatePage().
 *
 * Fires after form state is initialized (submitted values available) but
 * before processSubmittedFormValues() runs validation.
 */
#[AsEventListener('t13forms/client-variants-validation')]
final class ClientVariantsValidationListener
{
    private readonly ClientVariantsEvaluator $evaluator;

    public function __construct()
    {
        $this->evaluator = new ClientVariantsEvaluator();
    }

    public function __invoke(AfterCurrentPageIsResolvedEvent $event): void
    {
        $formRuntime = $event->formRuntime;
        $formState = $formRuntime->getFormState();

        if ($formState === null || !$formState->isFormSubmitted()) {
            return;
        }

        $formValues = $this->collectFormValues($formRuntime);

        foreach ($formRuntime->getFormDefinition()->getPages() as $page) {
            foreach ($page->getElementsRecursively() as $element) {
                if ($element instanceof FormElementInterface) {
                    $this->evaluateElement($element, $formValues);
                }
            }
        }
    }

    /**
     * Collects submitted form values by merging the persisted form state
     * with the current request arguments. Request values take precedence
     * because the form state is only populated AFTER processSubmittedFormValues(),
     * which runs after this event.
     *
     * @return array<string, string>
     */
    private function collectFormValues(\TYPO3\CMS\Form\Domain\Runtime\FormRuntime $formRuntime): array
    {
        $values = [];
        $formState = $formRuntime->getFormState();
        $requestArgs = $formRuntime->getRequest()->getArguments();

        foreach ($formRuntime->getFormDefinition()->getPages() as $page) {
            foreach ($page->getElementsRecursively() as $element) {
                $id = $element->getIdentifier();
                $value = $requestArgs[$id] ?? $formState->getFormValue($id);
                if (is_string($value)) {
                    $values[$id] = $value;
                } elseif (is_array($value)) {
                    $values[$id] = $value['date'] ?? implode(' ', array_filter($value, 'is_string'));
                } else {
                    $values[$id] = (string) ($value ?? '');
                }
            }
        }

        return $values;
    }

    private function evaluateElement(FormElementInterface $element, array $formValues): void
    {
        $properties = $element->getProperties();
        $clientVariants = $properties['clientVariants'] ?? null;

        if (!is_array($clientVariants) || $clientVariants === []) {
            return;
        }

        $enabled = $this->shouldBeEnabled($clientVariants, $formValues);

        if (!$enabled && $element instanceof AbstractRenderable) {
            $element->setRenderingOption('enabled', false);
        }
    }

    /**
     * Evaluates variant conditions: the field is enabled if at least one
     * variant with enabled:true has its condition met.
     *
     * @param array<int, array{condition: string, enabled?: bool}> $variants
     * @param array<string, string> $formValues
     */
    private function shouldBeEnabled(array $variants, array $formValues): bool
    {
        foreach ($variants as $variant) {
            $condition = $variant['condition'] ?? '';
            $variantEnabled = $variant['enabled'] ?? false;

            if ($condition === '' || $variantEnabled !== true) {
                continue;
            }

            if ($this->evaluator->evaluate($condition, $formValues)) {
                return true;
            }
        }

        return false;
    }
}
