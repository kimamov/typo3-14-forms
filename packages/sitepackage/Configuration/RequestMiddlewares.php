<?php

return [
    'frontend' => [
        't13forms/ajax-form-submit' => [
            'target' => \T13Forms\Sitepackage\Middleware\AjaxFormSubmitMiddleware::class,
            'after' => [
                'typo3/cms-frontend/prepare-tsfe-rendering',
            ],
            'before' => [
                'typo3/cms-frontend/shortcut-and-mountpoint-redirect',
            ],
        ],
    ],
];
