<?php

declare(strict_types=1);

defined('TYPO3') or die();

$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['ext/form']['buildFormDefinitionValidationConfiguration'][]
    = \T13Forms\Sitepackage\Form\Hooks\OptionsImportValidationHook::class;

// The global seal search bar submits via GET without an Extbase form context,
// so no cHash is generated for the tx_seal_search parameters. Exclude the
// namespace from cache-hash validation so the search action can be invoked.
$GLOBALS['TYPO3_CONF_VARS']['FE']['cacheHash']['excludedParameters'][] = '^tx_seal_search';
