<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Tests\Unit\EventListener;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use T13Forms\Sitepackage\EventListener\OptionsImportSaveListener;

final class OptionsImportSaveListenerTest extends TestCase
{
    private OptionsImportSaveListener $subject;

    protected function setUp(): void
    {
        $this->subject = new OptionsImportSaveListener();
    }

    private function buildForm(array $elements): array
    {
        return [
            'renderables' => [
                [
                    'type' => 'Page',
                    'renderables' => $elements,
                ],
            ],
        ];
    }

    private function invokeListener(array $form): array
    {
        $event = new \stdClass();
        $event->form = $form;

        // Use reflection to simulate the event -- the real BeforeFormIsSavedEvent
        // uses public properties, our simple stdClass suffices here.
        $listener = $this->subject;

        // Manually walk the same logic
        $formData = $event->form;
        if (isset($formData['renderables']) && is_array($formData['renderables'])) {
            $processMethod = new \ReflectionMethod($listener, 'processRenderables');
            $processMethod->setAccessible(true);
            $formData['renderables'] = $processMethod->invoke($listener, $formData['renderables']);
        }

        return $formData;
    }

    #[Test]
    public function truncatesOptionsToStubWhenProviderIsSet(): void
    {
        $form = $this->buildForm([
            [
                'type' => 'SingleSelect',
                'properties' => [
                    'optionsProvider' => [
                        'source' => '1:/options_providers/countries.csv',
                        'valueColumn' => 'value',
                        'labelColumn' => 'label',
                    ],
                    'options' => [
                        'de' => 'Germany',
                        'at' => 'Austria',
                        'ch' => 'Switzerland',
                        'fr' => 'France',
                        'it' => 'Italy',
                        'es' => 'Spain',
                    ],
                ],
            ],
        ]);

        $result = $this->invokeListener($form);
        $element = $result['renderables'][0]['renderables'][0];

        self::assertArrayHasKey('optionsProvider', $element['properties']);
        self::assertArrayHasKey('options', $element['properties']);
        self::assertCount(4, $element['properties']['options']);
        self::assertSame(
            ['de' => 'Germany', 'at' => 'Austria', 'ch' => 'Switzerland', 'fr' => 'France'],
            $element['properties']['options'],
        );
    }

    #[Test]
    public function keepsAllOptionsIfFewerThanStubLimit(): void
    {
        $form = $this->buildForm([
            [
                'type' => 'SingleSelect',
                'properties' => [
                    'optionsProvider' => [
                        'source' => '1:/options_providers/small.csv',
                    ],
                    'options' => ['a' => 'A', 'b' => 'B'],
                ],
            ],
        ]);

        $result = $this->invokeListener($form);
        $element = $result['renderables'][0]['renderables'][0];

        self::assertCount(2, $element['properties']['options']);
    }

    #[Test]
    public function keepsOnlyAllowedProviderKeys(): void
    {
        $form = $this->buildForm([
            [
                'type' => 'MultiCheckbox',
                'properties' => [
                    'optionsProvider' => [
                        'source' => '1:/options_providers/uni.json',
                        'valueColumn' => 'code',
                        'labelColumn' => 'name',
                        'extraJunk' => 'should be removed',
                    ],
                ],
            ],
        ]);

        $result = $this->invokeListener($form);
        $provider = $result['renderables'][0]['renderables'][0]['properties']['optionsProvider'];

        self::assertArrayHasKey('source', $provider);
        self::assertArrayHasKey('valueColumn', $provider);
        self::assertArrayHasKey('labelColumn', $provider);
        self::assertArrayNotHasKey('extraJunk', $provider);
    }

    #[Test]
    public function removesEmptyProvider(): void
    {
        $form = $this->buildForm([
            [
                'type' => 'RadioButton',
                'properties' => [
                    'optionsProvider' => [],
                    'options' => ['a' => 'A'],
                ],
            ],
        ]);

        $result = $this->invokeListener($form);
        $element = $result['renderables'][0]['renderables'][0];

        self::assertArrayNotHasKey('optionsProvider', $element['properties']);
        self::assertArrayHasKey('options', $element['properties']);
    }

    #[Test]
    public function leavesNonOptionElementsAlone(): void
    {
        $form = $this->buildForm([
            [
                'type' => 'Text',
                'properties' => [
                    'someStuff' => 'untouched',
                ],
            ],
        ]);

        $result = $this->invokeListener($form);
        $element = $result['renderables'][0]['renderables'][0];

        self::assertSame('untouched', $element['properties']['someStuff']);
    }
}
