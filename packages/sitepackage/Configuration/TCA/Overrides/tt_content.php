<?php

declare(strict_types=1);

if (!defined('TYPO3')) {
    die('Access denied.');
}

use B13\Container\Tca\ContainerConfiguration;
use B13\Container\Tca\Registry;
use TYPO3\CMS\Core\Utility\ExtensionManagementUtility;
use TYPO3\CMS\Core\Utility\GeneralUtility;

// ---------------------------------------------------------------------------
// b13/container grid layouts
// ---------------------------------------------------------------------------

GeneralUtility::makeInstance(Registry::class)->configureContainer(
    (new ContainerConfiguration(
        'sitepackage_container_two_columns',
        'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.two_columns.label',
        'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.two_columns.description',
        [
            [
                ['name' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.column.left', 'colPos' => 200],
                ['name' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.column.right', 'colPos' => 201],
            ],
        ]
    ))
        ->setIcon('EXT:sitepackage/Resources/Public/Icons/sitepackage_container_two_columns.svg')
        ->setGroup('container')
        ->setSaveAndCloseInNewContentElementWizard(false)
        ->setDefaultValues([
            'tx_sitepackage_container_layout_2col' => 'equal',
            'tx_sitepackage_container_max_width' => 'default',
            'tx_sitepackage_container_bgcolor' => 'none',
            'tx_sitepackage_container_full_width' => 'default',
            'tx_sitepackage_container_space_before' => 'none',
            'tx_sitepackage_container_space_after' => 'none',
            'tx_sitepackage_container_stack_order' => 'default',
        ])
);

GeneralUtility::makeInstance(Registry::class)->configureContainer(
    (new ContainerConfiguration(
        'sitepackage_container_three_columns',
        'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.three_columns.label',
        'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.three_columns.description',
        [
            [
                ['name' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.column.left', 'colPos' => 210],
                ['name' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.column.center', 'colPos' => 211],
                ['name' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.column.right', 'colPos' => 212],
            ],
        ]
    ))
        ->setIcon('EXT:sitepackage/Resources/Public/Icons/sitepackage_container_three_columns.svg')
        ->setGroup('container')
        ->setSaveAndCloseInNewContentElementWizard(false)
        ->setDefaultValues([
            'tx_sitepackage_container_layout_3col' => 'equal',
            'tx_sitepackage_container_max_width' => 'default',
            'tx_sitepackage_container_bgcolor' => 'none',
            'tx_sitepackage_container_full_width' => 'default',
            'tx_sitepackage_container_space_before' => 'none',
            'tx_sitepackage_container_space_after' => 'none',
            'tx_sitepackage_container_stack_order' => 'default',
        ])
);

// --- Section container (single column, centered) ---------------------------
GeneralUtility::makeInstance(Registry::class)->configureContainer(
    (new ContainerConfiguration(
        'sitepackage_container_section',
        'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.section.label',
        'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.section.description',
        [
            [
                ['name' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.column.content', 'colPos' => 220],
            ],
        ]
    ))
        ->setIcon('EXT:sitepackage/Resources/Public/Icons/sitepackage_container_section.svg')
        ->setGroup('container')
        ->setSaveAndCloseInNewContentElementWizard(false)
        ->setDefaultValues([
            'tx_sitepackage_container_max_width' => 'default',
            'tx_sitepackage_container_bgcolor' => 'none',
            'tx_sitepackage_container_full_width' => 'default',
            'tx_sitepackage_container_space_before' => 'none',
            'tx_sitepackage_container_space_after' => 'none',
            'tx_sitepackage_container_stack_order' => 'default',
        ])
);

// ---------------------------------------------------------------------------
// Shared container styling / layout TCA fields
// ---------------------------------------------------------------------------

ExtensionManagementUtility::addTCAcolumns('tt_content', [
    'tx_sitepackage_container_layout_2col' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_2col.label',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'equal',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_2col.option.equal', 'value' => 'equal'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_2col.option.left_wide', 'value' => 'left_wide'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_2col.option.right_wide', 'value' => 'right_wide'],
            ],
        ],
    ],
    'tx_sitepackage_container_layout_3col' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_3col.label',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'equal',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_3col.option.equal', 'value' => 'equal'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_3col.option.wide_center', 'value' => 'wide_center'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_3col.option.wide_left', 'value' => 'wide_left'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.layout_3col.option.wide_right', 'value' => 'wide_right'],
            ],
        ],
    ],
    'tx_sitepackage_container_max_width' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.label',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'default',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.option.default', 'value' => 'default'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.option.sm', 'value' => 'sm'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.option.md', 'value' => 'md'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.option.lg', 'value' => 'lg'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.option.xl', 'value' => 'xl'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.max_width.option.full', 'value' => 'full'],
            ],
        ],
    ],
    'tx_sitepackage_container_bgcolor' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.bgcolor.label',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'none',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.bgcolor.option.none', 'value' => 'none'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.bgcolor.option.light', 'value' => 'light'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.bgcolor.option.dark', 'value' => 'dark'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.bgcolor.option.primary', 'value' => 'primary'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.bgcolor.option.accent', 'value' => 'accent'],
            ],
        ],
    ],
    'tx_sitepackage_container_full_width' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.full_width.label',
        'description' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.full_width.description',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'default',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.full_width.option.default', 'value' => 'default'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.full_width.option.full', 'value' => 'full'],
            ],
        ],
    ],
    'tx_sitepackage_container_space_before' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space_before.label',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'none',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.none', 'value' => 'none'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.sm', 'value' => 'sm'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.md', 'value' => 'md'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.lg', 'value' => 'lg'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.xl', 'value' => 'xl'],
            ],
        ],
    ],
    'tx_sitepackage_container_space_after' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space_after.label',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'none',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.none', 'value' => 'none'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.sm', 'value' => 'sm'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.md', 'value' => 'md'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.lg', 'value' => 'lg'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.space.option.xl', 'value' => 'xl'],
            ],
        ],
    ],
    'tx_sitepackage_container_stack_order' => [
        'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.stack_order.label',
        'description' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.stack_order.description',
        'config' => [
            'type' => 'select',
            'renderType' => 'selectSingle',
            'default' => 'default',
            'items' => [
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.stack_order.option.default', 'value' => 'default'],
                ['label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.stack_order.option.reverse', 'value' => 'reverse'],
            ],
        ],
    ],
]);

$GLOBALS['TCA']['tt_content']['palettes']['sitepackage_container_style'] = [
    'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.palette.style',
    'showitem' => 'tx_sitepackage_container_max_width, tx_sitepackage_container_bgcolor, --linebreak--, tx_sitepackage_container_full_width, --linebreak--, tx_sitepackage_container_space_before, tx_sitepackage_container_space_after, --linebreak--, tx_sitepackage_container_stack_order',
];

$GLOBALS['TCA']['tt_content']['palettes']['sitepackage_container_section_style'] = [
    'label' => 'LLL:EXT:sitepackage/Resources/Private/Language/locallang_db.xlf:container.palette.style',
    'showitem' => 'tx_sitepackage_container_max_width, tx_sitepackage_container_bgcolor, --linebreak--, tx_sitepackage_container_space_before, tx_sitepackage_container_space_after',
];

ExtensionManagementUtility::addToAllTCAtypes(
    'tt_content',
    '--palette--;;sitepackage_container_style',
    'sitepackage_container_two_columns,sitepackage_container_three_columns',
    'after:header'
);

ExtensionManagementUtility::addToAllTCAtypes(
    'tt_content',
    '--palette--;;sitepackage_container_section_style',
    'sitepackage_container_section',
    'after:header'
);

ExtensionManagementUtility::addToAllTCAtypes(
    'tt_content',
    'tx_sitepackage_container_layout_2col',
    'sitepackage_container_two_columns',
    'after:header'
);

ExtensionManagementUtility::addToAllTCAtypes(
    'tt_content',
    'tx_sitepackage_container_layout_3col',
    'sitepackage_container_three_columns',
    'after:header'
);
