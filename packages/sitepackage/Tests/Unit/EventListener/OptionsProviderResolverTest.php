<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Tests\Unit\EventListener;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use T13Forms\Sitepackage\EventListener\OptionsProviderResolver;
use T13Forms\Sitepackage\Form\OptionsImport\ImportResult;
use T13Forms\Sitepackage\Form\OptionsImport\OptionsImportService;
use TYPO3\CMS\Form\Mvc\Persistence\Event\AfterFormDefinitionLoadedEvent;

final class OptionsProviderResolverTest extends TestCase
{
    private function createEvent(array $definition): AfterFormDefinitionLoadedEvent
    {
        return new AfterFormDefinitionLoadedEvent($definition, 'test.form.yaml', 'cache-key');
    }

    private function createServiceMock(array $options): OptionsImportService
    {
        $service = $this->createMock(OptionsImportService::class);
        $service->method('import')->willReturn(new ImportResult($options, []));
        return $service;
    }

    #[Test]
    public function resolvesOptionsFromProviderReference(): void
    {
        $definition = [
            'renderables' => [
                [
                    'type' => 'Page',
                    'renderables' => [
                        [
                            'type' => 'SingleSelect',
                            'properties' => [
                                'optionsProvider' => [
                                    'source' => '1:/options_providers/countries.csv',
                                    'valueColumn' => 'code',
                                    'labelColumn' => 'name',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $expected = ['de' => 'Germany', 'at' => 'Austria'];
        $resolver = new OptionsProviderResolver($this->createServiceMock($expected));
        $event = $this->createEvent($definition);

        $resolver($event);

        $result = $event->getFormDefinition();
        $element = $result['renderables'][0]['renderables'][0];

        self::assertSame($expected, $element['properties']['options']);
    }

    #[Test]
    public function leavesElementsWithoutProviderUntouched(): void
    {
        $definition = [
            'renderables' => [
                [
                    'type' => 'Page',
                    'renderables' => [
                        [
                            'type' => 'SingleSelect',
                            'properties' => [
                                'options' => ['a' => 'A', 'b' => 'B'],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $service = $this->createMock(OptionsImportService::class);
        $service->expects(self::never())->method('import');

        $resolver = new OptionsProviderResolver($service);
        $event = $this->createEvent($definition);

        $resolver($event);

        $result = $event->getFormDefinition();
        $element = $result['renderables'][0]['renderables'][0];

        self::assertSame(['a' => 'A', 'b' => 'B'], $element['properties']['options']);
    }

    #[Test]
    public function setsEmptyOptionsOnImportFailure(): void
    {
        $definition = [
            'renderables' => [
                [
                    'type' => 'Page',
                    'renderables' => [
                        [
                            'type' => 'RadioButton',
                            'properties' => [
                                'optionsProvider' => [
                                    'source' => '1:/options_providers/missing.csv',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $service = $this->createMock(OptionsImportService::class);
        $service->method('import')->willThrowException(new \RuntimeException('File not found'));

        $resolver = new OptionsProviderResolver($service);
        $event = $this->createEvent($definition);

        $resolver($event);

        $result = $event->getFormDefinition();
        $element = $result['renderables'][0]['renderables'][0];

        self::assertSame([], $element['properties']['options']);
    }

    #[Test]
    public function skipsNonOptionElements(): void
    {
        $definition = [
            'renderables' => [
                [
                    'type' => 'Page',
                    'renderables' => [
                        [
                            'type' => 'Text',
                            'properties' => [
                                'optionsProvider' => [
                                    'source' => '1:/options_providers/countries.csv',
                                ],
                            ],
                        ],
                    ],
                ],
            ],
        ];

        $service = $this->createMock(OptionsImportService::class);
        $service->expects(self::never())->method('import');

        $resolver = new OptionsProviderResolver($service);
        $event = $this->createEvent($definition);

        $resolver($event);
    }
}
