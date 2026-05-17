<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Tests\Unit\Form\OptionsImport;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use T13Forms\Sitepackage\Form\OptionsImport\OptionSanitizer;

final class OptionSanitizerTest extends TestCase
{
    private OptionSanitizer $subject;

    protected function setUp(): void
    {
        $this->subject = new OptionSanitizer();
    }

    #[Test]
    public function sanitizesValidRows(): void
    {
        $rows = [
            ['value' => 'de', 'label' => 'Germany'],
            ['value' => 'at', 'label' => 'Austria'],
        ];

        $result = $this->subject->sanitize($rows);

        self::assertSame(['de' => 'Germany', 'at' => 'Austria'], $result);
    }

    #[Test]
    public function castNumericValuesToString(): void
    {
        $rows = [
            ['value' => 1, 'label' => 'One'],
            ['value' => 2, 'label' => 'Two'],
        ];

        $result = $this->subject->sanitize($rows);

        self::assertSame(['1' => 'One', '2' => 'Two'], $result);
    }

    #[Test]
    public function stripsHtmlTags(): void
    {
        $rows = [
            ['value' => 'xss', 'label' => '<script>alert("xss")</script>Safe'],
        ];

        $result = $this->subject->sanitize($rows);

        self::assertSame(['xss' => 'alert("xss")Safe'], $result);
    }

    #[Test]
    public function stripsNullBytesAndControlChars(): void
    {
        $rows = [
            ['value' => "te\x00st", 'label' => "la\x01bel"],
        ];

        $result = $this->subject->sanitize($rows);

        self::assertSame(['test' => 'label'], $result);
    }

    #[Test]
    public function rejectsEmptyValueAfterSanitization(): void
    {
        $rows = [
            ['value' => '  ', 'label' => 'Something'],
        ];

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/value must not be empty/');

        $this->subject->sanitize($rows);
    }

    #[Test]
    public function rejectsEmptyLabelAfterSanitization(): void
    {
        $rows = [
            ['value' => 'ok', 'label' => '  '],
        ];

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/label must not be empty/');

        $this->subject->sanitize($rows);
    }

    #[Test]
    public function rejectsDuplicateValues(): void
    {
        $rows = [
            ['value' => 'de', 'label' => 'Germany'],
            ['value' => 'de', 'label' => 'Deutschland'],
        ];

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/duplicate value/');

        $this->subject->sanitize($rows);
    }

    #[Test]
    public function rejectsEmptyRowList(): void
    {
        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/no option rows/');

        $this->subject->sanitize([]);
    }

    #[Test]
    public function rejectsNonScalarValue(): void
    {
        $rows = [
            ['value' => ['nested'], 'label' => 'Oops'],
        ];

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/value must be a scalar/');

        $this->subject->sanitize($rows);
    }

    #[Test]
    public function rejectsNonScalarLabel(): void
    {
        $rows = [
            ['value' => 'ok', 'label' => ['nested']],
        ];

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/label must be a scalar/');

        $this->subject->sanitize($rows);
    }

    #[Test]
    public function truncatesOverlyLongValues(): void
    {
        $longVal = str_repeat('a', 300);
        $rows = [
            ['value' => $longVal, 'label' => 'Fine'],
        ];

        $result = $this->subject->sanitize($rows);
        $key = array_key_first($result);

        self::assertSame(255, mb_strlen($key));
    }
}
