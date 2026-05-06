<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\EventListener;

use TYPO3\CMS\Core\Attribute\AsEventListener;
use TYPO3\CMS\Core\Configuration\Event\AfterFlexFormDataStructureParsedEvent;

/**
 * Adds a "Use AJAX submission" checkbox to the form plugin's FlexForm
 * settings, right alongside the existing "Override finisher settings" option.
 */
#[AsEventListener('t13forms/add-ajax-flexform-field')]
final class AddAjaxFlexFormFieldListener
{
    public function __invoke(AfterFlexFormDataStructureParsedEvent $event): void
    {
        $identifier = $event->getIdentifier();

        if (!isset($identifier['ext-form-persistenceIdentifier'])) {
            return;
        }

        $dataStructure = $event->getDataStructure();

        $dataStructure['sheets']['sDEF']['ROOT']['el']['settings.useAjax'] = [
            'label' => 'Use AJAX submission',
            'description' => 'When enabled, the form will be submitted via AJAX and return JSON instead of reloading the page.',
            'config' => [
                'type' => 'check',
            ],
        ];

        $event->setDataStructure($dataStructure);
    }
}
