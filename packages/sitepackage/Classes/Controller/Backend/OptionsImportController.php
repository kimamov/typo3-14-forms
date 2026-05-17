<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Controller\Backend;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use TYPO3\CMS\Core\Http\JsonResponse;
use T13Forms\Sitepackage\Form\OptionsImport\OptionsImportService;

final class OptionsImportController
{
    public function __construct(
        private readonly OptionsImportService $importService,
    ) {}

    /**
     * Returns the list of CSV/JSON files in the fixed provider directory
     * so the editor can render a dropdown.
     */
    public function listFilesAction(ServerRequestInterface $request): ResponseInterface
    {
        try {
            $files = $this->importService->listFiles();
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage(),
                'files' => [],
            ], 500);
        }

        return new JsonResponse([
            'success' => true,
            'files' => $files,
            'directory' => OptionsImportService::PROVIDER_DIRECTORY,
        ]);
    }

    public function importAction(ServerRequestInterface $request): ResponseInterface
    {
        $body = $request->getParsedBody();
        $fileIdentifier = trim((string)($body['file'] ?? ''));
        $valueColumn = trim((string)($body['valueColumn'] ?? 'value'));
        $labelColumn = trim((string)($body['labelColumn'] ?? 'label'));

        if ($fileIdentifier === '') {
            return new JsonResponse([
                'success' => false,
                'error' => 'No file identifier provided.',
            ], 400);
        }

        try {
            $result = $this->importService->import($fileIdentifier, $valueColumn, $labelColumn);
        } catch (\Throwable $e) {
            return new JsonResponse([
                'success' => false,
                'error' => $e->getMessage(),
            ], 400);
        }

        return new JsonResponse([
            'success' => true,
            'options' => $result->options,
            'optionsImport' => $result->metadata,
        ]);
    }
}
