<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 't13-forms Sitepackage',
    'description' => 'Sitepackage for the t13-forms project',
    'category' => 'templates',
    'version' => '1.0.0',
    'state' => 'stable',
    'constraints' => [
        'depends' => [
            'typo3' => '14.0.0-14.99.99',
            'fluid_styled_content' => '',
            'form' => '',
            'content_blocks' => '',
            'container' => '',
            'vite_asset_collector' => '',
        ],
    ],
];
