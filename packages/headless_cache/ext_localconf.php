<?php
declare(strict_types=1);

defined('TYPO3') or die();

use Mir\HeadlessCache\DataHandling\DataHandlerHook;

$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']
['t3lib/class.t3lib_tcemain.php']
['processDatamapClass'][]=DataHandlerHook::class;


$GLOBALS['TYPO3_CONF_VARS']['SC_OPTIONS']
['t3lib/class.t3lib_tcemain.php']
['processCmdmapClass'][]=DataHandlerHook::class;