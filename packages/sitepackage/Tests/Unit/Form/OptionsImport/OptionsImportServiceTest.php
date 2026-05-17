<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Tests\Unit\Form\OptionsImport;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use T13Forms\Sitepackage\Form\OptionsImport\OptionSanitizer;
use T13Forms\Sitepackage\Form\OptionsImport\OptionsImportService;
use TYPO3\CMS\Core\Resource\File;
use TYPO3\CMS\Core\Resource\Folder;
use TYPO3\CMS\Core\Resource\ResourceFactory;

final class OptionsImportServiceTest extends TestCase
{
    /**
     * Files returned by the mock always have a combined identifier inside
     * the provider directory so the path-guard passes.
     */
    private function createService(File $file): OptionsImportService
    {
        $resourceFactory = $this->createMock(ResourceFactory::class);
        $resourceFactory->method('retrieveFileOrFolderObject')->willReturn($file);

        return new OptionsImportService($resourceFactory, new OptionSanitizer());
    }

    private function createFileMock(
        string $extension,
        string $contents,
        int $size = null,
        string $directory = '1:/options_providers/',
    ): File {
        $file = $this->createMock(File::class);
        $file->method('getExtension')->willReturn($extension);
        $file->method('getContents')->willReturn($contents);
        $file->method('getSize')->willReturn($size ?? strlen($contents));
        $file->method('getCombinedIdentifier')->willReturn($directory . 'test.' . $extension);
        $file->method('getName')->willReturn('test.' . $extension);
        $file->method('getUid')->willReturn(42);
        return $file;
    }

    // ---- listFiles() ----

    #[Test]
    public function listFilesReturnsFilesFromProviderDirectory(): void
    {
        $csvFile = $this->createFileMock('csv', '');
        $jsonFile = $this->createMock(File::class);
        $jsonFile->method('getExtension')->willReturn('json');
        $jsonFile->method('getCombinedIdentifier')->willReturn('1:/options_providers/data.json');
        $jsonFile->method('getName')->willReturn('data.json');

        $folder = $this->createMock(Folder::class);
        $folder->method('getFiles')->willReturn([$csvFile, $jsonFile]);

        $resourceFactory = $this->createMock(ResourceFactory::class);
        $resourceFactory->method('retrieveFileOrFolderObject')->willReturn($folder);

        $service = new OptionsImportService($resourceFactory, new OptionSanitizer());
        $result = $service->listFiles();

        self::assertCount(2, $result);
        self::assertSame('test.csv', $result[0]['name']);
        self::assertSame('data.json', $result[1]['name']);
    }

    #[Test]
    public function listFilesSkipsNonAllowedExtensions(): void
    {
        $phpFile = $this->createMock(File::class);
        $phpFile->method('getExtension')->willReturn('php');
        $phpFile->method('getName')->willReturn('evil.php');

        $folder = $this->createMock(Folder::class);
        $folder->method('getFiles')->willReturn([$phpFile]);

        $resourceFactory = $this->createMock(ResourceFactory::class);
        $resourceFactory->method('retrieveFileOrFolderObject')->willReturn($folder);

        $service = new OptionsImportService($resourceFactory, new OptionSanitizer());
        $result = $service->listFiles();

        self::assertSame([], $result);
    }

    // ---- import() ----

    #[Test]
    public function importsCsvWithHeaderRow(): void
    {
        $csv = "value,label\nde,Germany\nat,Austria\n";
        $file = $this->createFileMock('csv', $csv);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.csv');

        self::assertSame(['de' => 'Germany', 'at' => 'Austria'], $result->options);
        self::assertSame('csv', $result->metadata['format']);
        self::assertSame(2, $result->metadata['importedCount']);
        self::assertSame(42, $result->metadata['fileUid']);
        self::assertSame('1:/options_providers/test.csv', $result->metadata['source']);
    }

    #[Test]
    public function importsCsvWithCustomColumns(): void
    {
        $csv = "code,name,extra\nde,Germany,eu\nat,Austria,eu\n";
        $file = $this->createFileMock('csv', $csv);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.csv', 'code', 'name');

        self::assertSame(['de' => 'Germany', 'at' => 'Austria'], $result->options);
    }

    #[Test]
    public function importsCsvWithBom(): void
    {
        $csv = "\xEF\xBB\xBFvalue,label\nde,Germany\n";
        $file = $this->createFileMock('csv', $csv);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.csv');

        self::assertSame(['de' => 'Germany'], $result->options);
    }

    #[Test]
    public function importsJsonObjectMap(): void
    {
        $json = '{"de": "Germany", "at": "Austria"}';
        $file = $this->createFileMock('json', $json);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.json');

        self::assertSame(['de' => 'Germany', 'at' => 'Austria'], $result->options);
        self::assertSame('json', $result->metadata['format']);
    }

    #[Test]
    public function importsJsonArrayOfObjects(): void
    {
        $json = '[{"value": "de", "label": "Germany"}, {"value": "at", "label": "Austria"}]';
        $file = $this->createFileMock('json', $json);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.json');

        self::assertSame(['de' => 'Germany', 'at' => 'Austria'], $result->options);
    }

    #[Test]
    public function importsJsonArrayWithCustomColumns(): void
    {
        $json = '[{"code": "de", "name": "Germany"}]';
        $file = $this->createFileMock('json', $json);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.json', 'code', 'name');

        self::assertSame(['de' => 'Germany'], $result->options);
    }

    #[Test]
    public function rejectsFileOutsideProviderDirectory(): void
    {
        $file = $this->createFileMock('csv', 'value,label', null, '1:/somewhere_else/');
        $service = $this->createService($file);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/not inside the provider directory/');

        $service->import('1:/somewhere_else/test.csv');
    }

    #[Test]
    public function rejectsDisallowedExtension(): void
    {
        $file = $this->createFileMock('php', '<?php echo 1;');
        $service = $this->createService($file);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/not inside the provider directory|not allowed/');

        $service->import('1:/options_providers/evil.php');
    }

    #[Test]
    public function rejectsOversizedFile(): void
    {
        $file = $this->createFileMock('csv', 'value,label', 10 * 1024 * 1024);
        $service = $this->createService($file);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/maximum allowed size/');

        $service->import('1:/options_providers/huge.csv');
    }

    #[Test]
    public function rejectsCsvMissingValueColumn(): void
    {
        $csv = "name,label\nGermany,DE\n";
        $file = $this->createFileMock('csv', $csv);
        $service = $this->createService($file);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/does not contain a "value" column/');

        $service->import('1:/options_providers/test.csv');
    }

    #[Test]
    public function rejectsInvalidJsonStructure(): void
    {
        $json = '"just a string"';
        $file = $this->createFileMock('json', $json);
        $service = $this->createService($file);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/must be either an object/');

        $service->import('1:/options_providers/test.json');
    }

    #[Test]
    public function rejectsNonFileObject(): void
    {
        $resourceFactory = $this->createMock(ResourceFactory::class);
        $resourceFactory->method('retrieveFileOrFolderObject')->willReturn(null);

        $service = new OptionsImportService($resourceFactory, new OptionSanitizer());

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessageMatches('/does not point to a file/');

        $service->import('1:/options_providers/missing.csv');
    }

    #[Test]
    public function sanitizesHtmlPayloadsInCsv(): void
    {
        $csv = "value,label\nxss,\"<script>alert('xss')</script>Hello\"\n";
        $file = $this->createFileMock('csv', $csv);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.csv');

        self::assertSame(['xss' => "alert('xss')Hello"], $result->options);
    }

    #[Test]
    public function metadataContainsContentHash(): void
    {
        $csv = "value,label\nde,Germany\n";
        $file = $this->createFileMock('csv', $csv);
        $service = $this->createService($file);

        $result = $service->import('1:/options_providers/test.csv');

        self::assertSame(hash('sha256', $csv), $result->metadata['importedHash']);
    }
}
