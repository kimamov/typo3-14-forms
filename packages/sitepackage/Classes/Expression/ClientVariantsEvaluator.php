<?php

declare(strict_types=1);

namespace T13Forms\Sitepackage\Expression;

use Symfony\Component\ExpressionLanguage\ExpressionLanguage;

/**
 * Evaluates client variant condition expressions using Symfony ExpressionLanguage.
 *
 * The same condition strings are evaluated on the frontend by the TypeScript
 * expression parser. This PHP evaluator is the authoritative server-side check
 * that ensures validation is correctly skipped for conditionally hidden fields,
 * regardless of what the client reports.
 *
 * Supported functions:
 *   formValue("fieldIdentifier") - resolves to the submitted value of that field
 *
 * Supported operators (Symfony ExpressionLanguage):
 *   ==, !=, >, <, >=, <=, in, matches, and, or, not
 */
final class ClientVariantsEvaluator
{
    private readonly ExpressionLanguage $expressionLanguage;

    public function __construct()
    {
        $this->expressionLanguage = new ExpressionLanguage();
        $this->expressionLanguage->registerProvider(new FormValueExpressionProvider());
    }

    /**
     * Evaluates a condition expression against the given form values.
     *
     * @param string $condition The expression string (e.g. 'formValue("country") == "de"')
     * @param array<string, string> $formValues Map of field identifier => submitted value
     * @return bool Whether the condition is met
     */
    public function evaluate(string $condition, array $formValues): bool
    {
        $condition = $this->normalizeCondition($condition);

        try {
            $result = $this->expressionLanguage->evaluate($condition, [
                'formValues' => $formValues,
            ]);

            return (bool) $result;
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * Normalizes JS-style operators to Symfony ExpressionLanguage equivalents.
     * This allows conditions written with === / !== / && / || to work on both sides.
     */
    private function normalizeCondition(string $condition): string
    {
        $condition = str_replace('===', '==', $condition);
        $condition = str_replace('!==', '!=', $condition);
        $condition = str_replace('&&', 'and', $condition);
        $condition = str_replace('||', 'or', $condition);

        return $condition;
    }
}
