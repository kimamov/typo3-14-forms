<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Expression;

use Symfony\Component\ExpressionLanguage\ExpressionFunction;
use Symfony\Component\ExpressionLanguage\ExpressionFunctionProviderInterface;

/**
 * Provides the formValue() function to Symfony ExpressionLanguage
 * for evaluating client variant conditions.
 *
 * Usage in expressions: formValue("fieldIdentifier")
 * Resolves to the current string value of the named form field.
 */
final class FormValueExpressionProvider implements ExpressionFunctionProviderInterface
{
    public function getFunctions(): array
    {
        return [
            new ExpressionFunction(
                'formValue',
                static fn(string $fieldName): string => sprintf('($formValues[%s] ?? "")', $fieldName),
                static fn(array $variables, string $fieldName): string => (string) ($variables['formValues'][$fieldName] ?? ''),
            ),
        ];
    }
}
