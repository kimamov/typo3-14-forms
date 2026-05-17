<?php

use T13Forms\Sitepackage\Controller\Backend\OptionsImportController;

return [
    'sitepackage_options_import_files' => [
        'path' => '/sitepackage/options-import/files',
        'methods' => ['GET'],
        'target' => OptionsImportController::class . '::listFilesAction',
    ],
    'sitepackage_options_import' => [
        'path' => '/sitepackage/options-import',
        'methods' => ['POST'],
        'target' => OptionsImportController::class . '::importAction',
    ],
];
