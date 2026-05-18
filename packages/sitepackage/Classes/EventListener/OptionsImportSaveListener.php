<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Form\Event\BeforeFormIsSavedEvent;

/**
 * Ensures that when an element uses `properties.optionsProvider`,
 * the persisted YAML stays lean: only the provider reference plus a
 * small stub of options (first 4) is kept. The stub satisfies the
 * Form Editor's requirement that option elements always have at
 * least one option. At render time the full list is resolved from
 * the provider file.
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

    private const STUB_OPTION_COUNT = 4;

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

        $options = $element['properties']['options'] ?? [];
        if (is_array($options) && $options !== []) {
            $element['properties']['options'] = array_slice($options, 0, self::STUB_OPTION_COUNT, true);
        }
    }
}
