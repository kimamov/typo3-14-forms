<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Form\OptionsImport;

final class OptionSanitizer
{
    private const MAX_VALUE_LENGTH = 255;
    private const MAX_LABEL_LENGTH = 1024;
    private const MAX_OPTION_COUNT = 10000;

    /**
     * Sanitizes raw rows into a value => label map.
     *
     * @param list<array{value: mixed, label: mixed}> $rows
     * @return array<string, string>
     * @throws \RuntimeException on validation failure
     */
    public function sanitize(array $rows): array
    {
        if ($rows === []) {
            throw new \RuntimeException('The import file contains no option rows.');
        }

        if (count($rows) > self::MAX_OPTION_COUNT) {
            throw new \RuntimeException(
                sprintf('Too many options (%d). Maximum allowed is %d.', count($rows), self::MAX_OPTION_COUNT)
            );
        }

        $options = [];
        $seenValues = [];
        $errors = [];

        foreach ($rows as $index => $row) {
            $rowNum = $index + 1;

            $rawValue = $row['value'] ?? null;
            $rawLabel = $row['label'] ?? null;

            if (!is_scalar($rawValue)) {
                $errors[] = sprintf('Row %d: value must be a scalar.', $rowNum);
                continue;
            }
            if (!is_scalar($rawLabel)) {
                $errors[] = sprintf('Row %d: label must be a scalar.', $rowNum);
                continue;
            }

            $value = $this->cleanString((string)$rawValue, self::MAX_VALUE_LENGTH);
            $label = $this->cleanString((string)$rawLabel, self::MAX_LABEL_LENGTH);

            if ($value === '') {
                $errors[] = sprintf('Row %d: value must not be empty.', $rowNum);
                continue;
            }
            if ($label === '') {
                $errors[] = sprintf('Row %d: label must not be empty.', $rowNum);
                continue;
            }

            if (isset($seenValues[$value])) {
                $errors[] = sprintf('Row %d: duplicate value "%s" (first seen in row %d).', $rowNum, $value, $seenValues[$value]);
                continue;
            }

            $seenValues[$value] = $rowNum;
            $options[$value] = $label;
        }

        if ($errors !== []) {
            throw new \RuntimeException(
                "Option import validation failed:\n" . implode("\n", $errors)
            );
        }

        return $options;
    }

    private function cleanString(string $input, int $maxLength): string
    {
        $input = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $input) ?? $input;
        $input = strip_tags($input);
        $input = trim($input);

        if (mb_strlen($input) > $maxLength) {
            $input = mb_substr($input, 0, $maxLength);
        }

        return $input;
    }
}
