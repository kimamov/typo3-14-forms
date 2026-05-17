<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Form\Event\BeforeFormIsSavedEvent;

/**
 * Ensures that when an element uses `properties.optionsProvider`,
 * the generated `properties.options` are NOT persisted in the YAML.
 * Only the lightweight provider reference is kept.
 */
#[AsEventListener('t13forms/options-provider-save-guard')]
final class OptionsImportSaveListener
{
    private const OPTION_ELEMENT_TYPES = [
        'SingleSelect',
        'MultiSelect',
        'RadioButton',
        'MultiCheckbox',
    ];

    private const ALLOWED_PROVIDER_KEYS = [
        'source',
        'valueColumn',
        'labelColumn',
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
        $provider = $element['properties']['optionsProvider'] ?? null;

        if (!is_array($provider) || empty($provider['source'])) {
            unset($element['properties']['optionsProvider']);
            return;
        }

        $element['properties']['optionsProvider'] = array_intersect_key(
            $provider,
            array_flip(self::ALLOWED_PROVIDER_KEYS),
        );

        unset($element['properties']['options']);
    }
}
