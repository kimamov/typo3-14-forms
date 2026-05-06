<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\ViewHelpers\Form;

use TYPO3\CMS\Form\Domain\Model\FormElements\FormElementInterface;
use TYPO3\CMS\Form\Domain\Runtime\FormRuntime;
use TYPO3\CMS\Form\Service\TranslationService;
use TYPO3\CMS\Form\ViewHelpers\RenderRenderableViewHelper;
use TYPO3Fluid\Fluid\Core\ViewHelper\AbstractViewHelper;

/**
 * Serializes the validators attached to a form element into a JSON string
 * suitable for a data-validate attribute. This bridges server-side validation
 * rules to the client-side TypeScript enhancement layer.
 *
 * Messages are resolved through TYPO3's full translation chain:
 *   1. Custom validationErrorMessages on the element (form editor)
 *   2. XLIFF translation files (localized defaults)
 *   3. If neither yields a message, the client-side validators use their own fallbacks.
 *
 * Usage in Fluid:
 *   <div data-validate="{sitepackage:form.validationData(element: element)}">
 */
final class ValidationDataViewHelper extends AbstractViewHelper
{
    private const VALIDATOR_CLASS_MAP = [
        'NotEmptyValidator' => 'NotEmpty',
        'StringLengthValidator' => 'StringLength',
        'EmailAddressValidator' => 'EmailAddress',
        'RegularExpressionValidator' => 'RegularExpression',
        'NumberRangeValidator' => 'NumberRange',
        'IntegerValidator' => 'Integer',
        'FloatValidator' => 'Float',
        'AlphanumericValidator' => 'Alphanumeric',
        'NumberValidator' => 'Number',
        'DateTimeValidator' => 'DateTime',
        'CountValidator' => 'Count',
        'FileSizeValidator' => 'FileSize',
        'DateRangeValidator' => 'DateRange',
    ];

    /**
     * Primary error code per validator used to look up messages via
     * TranslationService. Codes chosen to produce the most useful
     * standalone message (no sprintf arguments required).
     */
    private const PRIMARY_ERROR_CODES = [
        'NotEmpty' => 1221560910,
        'Alphanumeric' => 1221551320,
        'StringLength' => 1238108068,
        'EmailAddress' => 1221559976,
        'Integer' => 1221560494,
        'Float' => 1221560288,
        'NumberRange' => 1221563685,
        'RegularExpression' => 1221565130,
        'Count' => 1475002976,
        'Text' => 1221565786,
        'DateTime' => 1238087674,
        'DateRange' => 1521293685,
        'FileSize' => 1505305752,
    ];

    private const FILTERED_OPTIONS = ['is_required'];

    public function __construct(
        private readonly TranslationService $translationService,
    ) {}

    public function initializeArguments(): void
    {
        $this->registerArgument('element', FormElementInterface::class, 'The form element to read validators from', true);
    }

    public function render(): string
    {
        /** @var FormElementInterface $element */
        $element = $this->arguments['element'];

        /** @var FormRuntime $formRuntime */
        $formRuntime = $this->renderingContext
            ->getViewHelperVariableContainer()
            ->get(RenderRenderableViewHelper::class, 'formRuntime');

        $validatorData = [];
        foreach ($element->getValidators() as $validator) {
            $shortName = (new \ReflectionClass($validator))->getShortName();
            $identifier = self::VALIDATOR_CLASS_MAP[$shortName]
                ?? str_replace('Validator', '', $shortName);

            $options = $validator->getOptions();
            $options = array_filter(
                $options,
                static fn(mixed $value, string $key): bool => $value !== null
                    && $value !== ''
                    && !in_array($key, self::FILTERED_OPTIONS, true),
                ARRAY_FILTER_USE_BOTH,
            );

            $message = $this->resolveMessage($identifier, $element, $formRuntime);
            if ($message !== '') {
                $options['message'] = $message;
            }

            $entry = ['type' => $identifier];
            if ($options !== []) {
                $entry['options'] = $options;
            }
            $validatorData[] = $entry;
        }

        if ($validatorData === []) {
            return '';
        }

        return json_encode($validatorData, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE);
    }

    /**
     * Resolves the error message through TYPO3's full translation chain:
     * custom validationErrorMessages → XLIFF translation files → empty string.
     * An empty return value tells the client-side to use its own fallback.
     */
    private function resolveMessage(
        string $identifier,
        FormElementInterface $element,
        FormRuntime $formRuntime,
    ): string {
        $code = self::PRIMARY_ERROR_CODES[$identifier] ?? null;
        if ($code === null) {
            return '';
        }

        return $this->translationService->translateFormElementError(
            $element,
            $code,
            [],
            '',
            $formRuntime,
        );
    }
}
