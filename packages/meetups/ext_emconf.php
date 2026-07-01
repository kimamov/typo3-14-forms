<?php

$EM_CONF[$_EXTKEY] = [
    'title' => 'Meetups',
    'description' => 'Simple meetup/event management with list/detail views and optional EXT:index/EXT:seal integration.',
    'category' => 'plugin',
    'version' => '1.0.0',
    'state' => 'stable',
    'constraints' => [
        'depends' => [
            'typo3' => '14.0.0-14.99.99',
            'fluid_styled_content' => '',
            'extbase' => '',
        ],
        'suggests' => [
            'index' => '',
            'seal' => '',
        ],
    ],
];
