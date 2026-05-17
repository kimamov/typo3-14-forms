<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Form\OptionsImport;

/**
 * @param array<string, string> $options   value => label map
 * @param array<string, mixed>  $metadata  import metadata (source, format, hash, etc.)
 */
final readonly class ImportResult
{
    public function __construct(
        public array $options,
        public array $metadata,
    ) {}
}
