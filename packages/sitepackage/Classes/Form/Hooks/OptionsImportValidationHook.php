<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Form\Hooks;

use TYPO3\CMS\Form\Domain\Configuration\FormDefinition\Validators\ValidationDto;

/**
 * Registers `properties.optionsProvider.*` as writable property paths so the
 * form editor backend does not reject the provider metadata on save.
 *
 * Connected via $GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['ext/form']['buildFormDefinitionValidationConfiguration'].
 */
final class OptionsImportValidationHook
{
    private const ELEMENT_TYPES = [
        'SingleSelect',
        'MultiSelect',
        'RadioButton',
        'MultiCheckbox',
    ];

    private const PROVIDER_PROPERTIES = [
        'properties.optionsProvider.source',
        'properties.optionsProvider.valueColumn',
        'properties.optionsProvider.labelColumn',
    ];

    /**
     * @return list<ValidationDto>
     */
    public function addAdditionalPropertyPaths(ValidationDto $validationDto): array
    {
        $paths = [];
        foreach (self::ELEMENT_TYPES as $type) {
            $typeDto = $validationDto->withFormElementType($type);
            foreach (self::PROVIDER_PROPERTIES as $path) {
                $paths[] = $typeDto->withPropertyPath($path);
            }
        }
        return $paths;
    }
}
