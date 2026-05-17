<?php

declare(strict_types=1);

defined('TYPO3') or die();

$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']['ext/form']['buildFormDefinitionValidationConfiguration'][]
    = \T13Forms\Sitepackage\Form\Hooks\OptionsImportValidationHook::class;
