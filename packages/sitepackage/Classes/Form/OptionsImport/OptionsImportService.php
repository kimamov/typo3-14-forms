<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Form\OptionsImport;

use TYPO3\CMS\Core\Resource\File;
use TYPO3\CMS\Core\Resource\Folder;
use TYPO3\CMS\Core\Resource\ResourceFactory;

final class OptionsImportService
{
    private const ALLOWED_EXTENSIONS = ['csv', 'json'];
    private const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

    /**
     * Fixed directory inside fileadmin where option-provider files live.
     * Editors pick from this directory only -- no free-text paths.
     */
    public const PROVIDER_DIRECTORY = '1:/options_providers/';

    public function __construct(
        private readonly ResourceFactory $resourceFactory,
        private readonly OptionSanitizer $sanitizer,
    ) {}

    /**
     * Lists all CSV/JSON files in the fixed provider directory.
     *
     * @return list<array{identifier: string, name: string}>
     */
    public function listFiles(): array
    {
        $folder = $this->resolveProviderFolder();

        $files = $folder->getFiles(0, 0, Folder::FILTER_MODE_USE_OWN_AND_STORAGE_FILTERS, false, 'name');
        $result = [];

        foreach ($files as $file) {
            if (!$file instanceof File) {
                continue;
            }
            $ext = strtolower($file->getExtension());
            if (!in_array($ext, self::ALLOWED_EXTENSIONS, true)) {
                continue;
            }
            $result[] = [
                'identifier' => $file->getCombinedIdentifier(),
                'name' => $file->getName(),
            ];
        }

        return $result;
    }

    private function resolveProviderFolder(): Folder
    {
        try {
            $object = $this->resourceFactory->retrieveFileOrFolderObject(self::PROVIDER_DIRECTORY);
        } catch (\Throwable $e) {
            throw new \RuntimeException(
                sprintf(
                    'Could not resolve provider directory "%s". '
                    . 'Make sure the folder exists in fileadmin: %s',
                    self::PROVIDER_DIRECTORY,
                    $e->getMessage(),
                ),
                1716000010,
                $e,
            );
        }

        if (!$object instanceof Folder) {
            throw new \RuntimeException(
                sprintf('The path "%s" is not a folder. Create it inside fileadmin.', self::PROVIDER_DIRECTORY),
                1716000011,
            );
        }

        return $object;
    }

    /**
     * Import options from a FAL file identified by its combined identifier (e.g. "1:/options_providers/countries.csv").
     *
     * The file must reside inside the fixed provider directory.
     */
    public function import(string $fileIdentifier, string $valueColumn = 'value', string $labelColumn = 'label'): ImportResult
    {
        $file = $this->resolveFile($fileIdentifier);
        $this->assertInsideProviderDirectory($file);
        $extension = strtolower($file->getExtension());

        $this->validateFile($file, $extension);

        $content = $file->getContents();
        $rows = match ($extension) {
            'csv' => $this->parseCsv($content, $valueColumn, $labelColumn),
            'json' => $this->parseJson($content, $valueColumn, $labelColumn),
            default => throw new \RuntimeException(sprintf('Unsupported file extension "%s".', $extension)),
        };

        $options = $this->sanitizer->sanitize($rows);

        $metadata = [
            'source' => $file->getCombinedIdentifier(),
            'fileUid' => $file->getUid(),
            'format' => $extension,
            'valueColumn' => $valueColumn,
            'labelColumn' => $labelColumn,
            'importedAt' => (new \DateTimeImmutable())->format('c'),
            'importedHash' => hash('sha256', $content),
            'importedCount' => count($options),
        ];

        return new ImportResult($options, $metadata);
    }

    private function resolveFile(string $fileIdentifier): File
    {
        try {
            $fileObject = $this->resourceFactory->retrieveFileOrFolderObject($fileIdentifier);
        } catch (\Throwable $e) {
            throw new \RuntimeException(
                sprintf('Could not resolve file "%s": %s', $fileIdentifier, $e->getMessage()),
                1716000001,
                $e,
            );
        }

        if (!$fileObject instanceof File) {
            throw new \RuntimeException(
                sprintf('The identifier "%s" does not point to a file.', $fileIdentifier),
                1716000002,
            );
        }

        return $fileObject;
    }

    private function assertInsideProviderDirectory(File $file): void
    {
        $identifier = $file->getCombinedIdentifier();
        $providerDir = rtrim(self::PROVIDER_DIRECTORY, '/') . '/';

        if (!str_starts_with($identifier, $providerDir)) {
            throw new \RuntimeException(
                sprintf('File "%s" is not inside the provider directory "%s".', $identifier, $providerDir),
                1716000005,
            );
        }
    }

    private function validateFile(File $file, string $extension): void
    {
        if (!in_array($extension, self::ALLOWED_EXTENSIONS, true)) {
            throw new \RuntimeException(
                sprintf(
                    'File extension "%s" is not allowed. Allowed extensions: %s.',
                    $extension,
                    implode(', ', self::ALLOWED_EXTENSIONS),
                ),
                1716000003,
            );
        }

        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new \RuntimeException(
                sprintf('File exceeds the maximum allowed size of %d bytes.', self::MAX_FILE_SIZE),
                1716000004,
            );
        }
    }

    /**
     * @return list<array{value: mixed, label: mixed}>
     */
    private function parseCsv(string $content, string $valueColumn, string $labelColumn): array
    {
        $content = $this->stripBom($content);
        $lines = str_getcsv($content, "\n");

        if ($lines === [] || $lines === [null]) {
            throw new \RuntimeException('CSV file is empty.');
        }

        $headerLine = array_shift($lines);
        $headers = str_getcsv((string)$headerLine);
        $headers = array_map('trim', $headers);

        $valueIndex = array_search($valueColumn, $headers, true);
        $labelIndex = array_search($labelColumn, $headers, true);

        if ($valueIndex === false) {
            throw new \RuntimeException(
                sprintf('CSV header does not contain a "%s" column. Found columns: %s', $valueColumn, implode(', ', $headers))
            );
        }
        if ($labelIndex === false) {
            throw new \RuntimeException(
                sprintf('CSV header does not contain a "%s" column. Found columns: %s', $labelColumn, implode(', ', $headers))
            );
        }

        $rows = [];
        foreach ($lines as $line) {
            if ($line === null || trim($line) === '') {
                continue;
            }
            $cols = str_getcsv($line);
            $rows[] = [
                'value' => $cols[$valueIndex] ?? '',
                'label' => $cols[$labelIndex] ?? '',
            ];
        }

        return $rows;
    }

    /**
     * @return list<array{value: mixed, label: mixed}>
     */
    private function parseJson(string $content, string $valueColumn, string $labelColumn): array
    {
        $data = json_decode($content, true, 32, JSON_THROW_ON_ERROR);

        if (is_array($data) && !array_is_list($data)) {
            $rows = [];
            foreach ($data as $key => $val) {
                $rows[] = ['value' => $key, 'label' => $val];
            }
            return $rows;
        }

        if (is_array($data) && array_is_list($data)) {
            $rows = [];
            foreach ($data as $item) {
                if (!is_array($item)) {
                    throw new \RuntimeException('JSON array elements must be objects with value/label keys.');
                }
                $rows[] = [
                    'value' => $item[$valueColumn] ?? '',
                    'label' => $item[$labelColumn] ?? '',
                ];
            }
            return $rows;
        }

        throw new \RuntimeException('JSON must be either an object (value:label map) or an array of objects.');
    }

    private function stripBom(string $content): string
    {
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            return substr($content, 3);
        }
        return $content;
    }
}
