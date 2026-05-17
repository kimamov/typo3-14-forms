<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use T13Forms\Sitepackage\Form\OptionsImport\OptionsImportService;
use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Form\Mvc\Persistence\Event\AfterFormDefinitionLoadedEvent;

/**
 * Resolves `properties.optionsProvider` references into actual
 * `properties.options` every time a form definition is loaded.
 *
 * This keeps the YAML lean (only the file reference is stored) while
 * the rendered form always gets the current file content.
 */
#[AsEventListener('t13forms/options-provider-resolver')]
final class OptionsProviderResolver
{
    private const OPTION_ELEMENT_TYPES = [
        'SingleSelect',
        'MultiSelect',
        'RadioButton',
        'MultiCheckbox',
    ];

    public function __construct(
        private readonly OptionsImportService $importService,
    ) {}

    public function __invoke(AfterFormDefinitionLoadedEvent $event): void
    {
        $definition = $event->getFormDefinition();

        if (!isset($definition['renderables']) || !is_array($definition['renderables'])) {
            return;
        }

        $definition['renderables'] = $this->processRenderables($definition['renderables']);
        $event->setFormDefinition($definition);
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

            $this->resolveProvider($renderable);
        }

        return $renderables;
    }

    private function resolveProvider(array &$element): void
    {
        $provider = $element['properties']['optionsProvider'] ?? null;

        if (!is_array($provider) || empty($provider['source'])) {
            return;
        }

        $source = (string)$provider['source'];
        $valueColumn = (string)($provider['valueColumn'] ?? 'value');
        $labelColumn = (string)($provider['labelColumn'] ?? 'label');

        try {
            $result = $this->importService->import($source, $valueColumn, $labelColumn);
            $element['properties']['options'] = $result->options;
        } catch (\Throwable) {
            // File not found / invalid -- leave options empty so the form
            // still renders (just without options).
            $element['properties']['options'] = [];
        }
    }
}
