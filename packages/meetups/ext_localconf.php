<?php

use T13\Meetups\Controller\EventController;

if (!defined('TYPO3')) {
    die('Access denied.');
}

// Frontend plugin registration
\TYPO3\CMS\Extbase\Utility\ExtensionUtility::configurePlugin(
    'Meetups',
    'Event',
    [
        EventController::class => 'list, show, new, create',
    ],
    // Non-cacheable actions
    [
        EventController::class => 'new, create',
    ],
    \TYPO3\CMS\Extbase\Utility\ExtensionUtility::PLUGIN_TYPE_CONTENT_ELEMENT
);
