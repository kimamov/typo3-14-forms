<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Form\OptionsImport;

/**
 * @param array<string, string> $options   value => label map
 * @param array<string, mixed>  $metadata  stored as properties.optionsImport
 */
final readonly class ImportResult
{
    public function __construct(
        public array $options,
        public array $metadata,
    ) {}
}
