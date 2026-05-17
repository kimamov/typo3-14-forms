<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Form\Event\BeforeFormIsSavedEvent;

/**
 * Normalizes properties.optionsImport metadata and ensures properties.options
 * are clean strings before a form definition is persisted.
 */
#[AsEventListener('t13forms/options-import-save-guard')]
final class OptionsImportSaveListener
{
    private const OPTION_ELEMENT_TYPES = [
        'SingleSelect',
        'MultiSelect',
        'RadioButton',
        'MultiCheckbox',
    ];

    public function __invoke(BeforeFormIsSavedEvent $event): void
    {
        $form = $event->form;

        if (!isset($form['renderables']) || !is_array($form['renderables'])) {
            return;
        }

        $form['renderables'] = $this->processRenderables($form['renderables']);
        $event->form = $form;
    }

    private function processRenderables(array $renderables): array
    {
        foreach ($renderables as &$renderable) {
            if (isset($renderable['renderables']) && is_array($renderable['renderables'])) {
                $renderable['renderables'] = $this->processRenderables($renderable['renderables']);
            }

            $type = $renderable['type'] ?? '';
            if (!in_array($type, self::OPTION_ELEMENT_TYPES, true)) {
                continue;
            }

            $this->normalizeElement($renderable);
        }

        return $renderables;
    }

    private function normalizeElement(array &$element): void
    {
        $import = $element['properties']['optionsImport'] ?? null;
        if (!is_array($import) || ($import === [])) {
            unset($element['properties']['optionsImport']);
            return;
        }

        $allowed = ['source', 'fileUid', 'format', 'valueColumn', 'labelColumn', 'importedAt', 'importedHash', 'importedCount'];
        $element['properties']['optionsImport'] = array_intersect_key($import, array_flip($allowed));

        if (isset($element['properties']['options']) && is_array($element['properties']['options'])) {
            $clean = [];
            foreach ($element['properties']['options'] as $value => $label) {
                $clean[(string)$value] = (string)$label;
            }
            $element['properties']['options'] = $clean;
        }
    }
}
