<?php

use T13\Meetups\Controller\EventController;

if (!defined('TYPO3')) {
    die('Access denied.');
}

\TYPO3\CMS\Extbase\Utility\ExtensionUtility::registerPlugin(
    'Meetups',
    'Event',
    'LLL:EXT:meetups/Resources/Private/Language/locallang.xlf:plugin.event.title',
    'EXT:meetups/Resources/Public/Icons/Extension.svg',
    'plugins',
    'LLL:EXT:meetups/Resources/Private/Language/locallang.xlf:plugin.event.description'
);

// Define the editing form for the Meetups plugin content element.
// The "pages" field is exposed here as the record storage page selector.
$GLOBALS['TCA']['tt_content']['types']['meetups_event'] = [
    'showitem' => '
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:general,
            --palette--;;general,
            --palette--;;headers,
        --div--;LLL:EXT:frontend/Resources/Private/Language/locallang_ttc.xlf:tabs.plugin,
            pages;LLL:EXT:frontend/Resources/Private/Language/locallang_ttc.xlf:pages.ALT.list_formlabel,
            recursive,
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:appearance,
            --palette--;;frames,
            --palette--;;appearanceLinks,
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:categories,
            categories,
        --div--;LLL:EXT:core/Resources/Private/Language/Form/locallang_tabs.xlf:extended,
    ',
];
