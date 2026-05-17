<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Form\Hooks;

use TYPO3\CMS\Form\Domain\Configuration\FormDefinition\Validators\ValidationDto;

/**
 * Registers properties.optionsImport.* as writable property paths so the
 * form editor backend does not reject the imported metadata on save.
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

    private const IMPORT_PROPERTIES = [
        'properties.optionsImport.source',
        'properties.optionsImport.fileUid',
        'properties.optionsImport.format',
        'properties.optionsImport.valueColumn',
        'properties.optionsImport.labelColumn',
        'properties.optionsImport.importedAt',
        'properties.optionsImport.importedHash',
        'properties.optionsImport.importedCount',
    ];

    /**
     * @return list<ValidationDto>
     */
    public function addAdditionalPropertyPaths(ValidationDto $validationDto): array
    {
        $paths = [];
        foreach (self::ELEMENT_TYPES as $type) {
            $typeDto = $validationDto->withFormElementType($type);
            foreach (self::IMPORT_PROPERTIES as $path) {
                $paths[] = $typeDto->withPropertyPath($path);
            }
        }
        return $paths;
    }
}
