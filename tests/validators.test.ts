import { describe, it, expect } from 'vitest';
import { registerDefaultValidators, runValidators } from '../src/forms/validators/index';
import type { ValidatorRule } from '../src/forms/types';



describe('Validators', () => {
  registerDefaultValidators();

  describe('NotEmpty', () => {
    const rules: ValidatorRule[] = [{ type: 'NotEmpty' }];

    it('fails on empty string', () => {
      const result = runValidators(rules, '');
      expect(result).toHaveLength(1);
      expect(result[0].message).toBe('This field is required.');
    });

    it('fails on whitespace-only string', () => {
      expect(runValidators(rules, '   ')).toHaveLength(1);
    });

    it('passes on non-empty string', () => {
      expect(runValidators(rules, 'hello')).toHaveLength(0);
    });

    it('uses custom message when provided', () => {
      const custom: ValidatorRule[] = [{ type: 'NotEmpty', options: { message: 'Fill this in!' } }];
      const result = runValidators(custom, '');
      expect(result[0].message).toBe('Fill this in!');
    });
  });

  describe('StringLength', () => {
    it('passes when empty (not required)', () => {
      const rules: ValidatorRule[] = [{ type: 'StringLength', options: { minimum: 3 } }];
      expect(runValidators(rules, '')).toHaveLength(0);
    });

    it('fails when below minimum', () => {
      const rules: ValidatorRule[] = [{ type: 'StringLength', options: { minimum: 5 } }];
      const result = runValidators(rules, 'abc');
      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('at least 5');
    });

    it('fails when above maximum', () => {
      const rules: ValidatorRule[] = [{ type: 'StringLength', options: { maximum: 3 } }];
      const result = runValidators(rules, 'abcdef');
      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('at most 3');
    });

    it('passes when within range', () => {
      const rules: ValidatorRule[] = [{ type: 'StringLength', options: { minimum: 2, maximum: 10 } }];
      expect(runValidators(rules, 'hello')).toHaveLength(0);
    });

    it('passes at exact boundary values', () => {
      const rules: ValidatorRule[] = [{ type: 'StringLength', options: { minimum: 3, maximum: 5 } }];
      expect(runValidators(rules, 'abc')).toHaveLength(0);
      expect(runValidators(rules, 'abcde')).toHaveLength(0);
    });
  });

  describe('EmailAddress', () => {
    const rules: ValidatorRule[] = [{ type: 'EmailAddress' }];

    it('passes when empty', () => {
      expect(runValidators(rules, '')).toHaveLength(0);
    });

    it('passes for valid email', () => {
      expect(runValidators(rules, 'user@example.com')).toHaveLength(0);
    });

    it('fails for missing @', () => {
      expect(runValidators(rules, 'userexample.com')).toHaveLength(1);
    });

    it('fails for missing domain', () => {
      expect(runValidators(rules, 'user@')).toHaveLength(1);
    });

    it('fails for missing TLD', () => {
      expect(runValidators(rules, 'user@example')).toHaveLength(1);
    });

    it('fails for spaces', () => {
      expect(runValidators(rules, 'user @example.com')).toHaveLength(1);
    });
  });

  describe('Integer', () => {
    const rules: ValidatorRule[] = [{ type: 'Integer' }];

    it('passes when empty', () => {
      expect(runValidators(rules, '')).toHaveLength(0);
    });

    it('passes for valid integer', () => {
      expect(runValidators(rules, '42')).toHaveLength(0);
    });

    it('passes for negative integer', () => {
      expect(runValidators(rules, '-7')).toHaveLength(0);
    });

    it('fails for float', () => {
      expect(runValidators(rules, '3.14')).toHaveLength(1);
    });

    it('fails for letters', () => {
      expect(runValidators(rules, 'abc')).toHaveLength(1);
    });
  });

  describe('NumberRange', () => {
    it('passes when empty', () => {
      const rules: ValidatorRule[] = [{ type: 'NumberRange', options: { minimum: 1, maximum: 10 } }];
      expect(runValidators(rules, '')).toHaveLength(0);
    });

    it('fails for non-numeric input', () => {
      const rules: ValidatorRule[] = [{ type: 'NumberRange', options: { minimum: 1 } }];
      expect(runValidators(rules, 'abc')).toHaveLength(1);
    });

    it('fails when below minimum', () => {
      const rules: ValidatorRule[] = [{ type: 'NumberRange', options: { minimum: 5 } }];
      const result = runValidators(rules, '3');
      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('at least 5');
    });

    it('fails when above maximum', () => {
      const rules: ValidatorRule[] = [{ type: 'NumberRange', options: { maximum: 100 } }];
      const result = runValidators(rules, '150');
      expect(result).toHaveLength(1);
      expect(result[0].message).toContain('at most 100');
    });

    it('passes when within range', () => {
      const rules: ValidatorRule[] = [{ type: 'NumberRange', options: { minimum: 1, maximum: 100 } }];
      expect(runValidators(rules, '50')).toHaveLength(0);
    });

    it('passes at exact boundaries', () => {
      const rules: ValidatorRule[] = [{ type: 'NumberRange', options: { minimum: 1, maximum: 10 } }];
      expect(runValidators(rules, '1')).toHaveLength(0);
      expect(runValidators(rules, '10')).toHaveLength(0);
    });
  });

  describe('RegularExpression', () => {
    it('passes when empty', () => {
      const rules: ValidatorRule[] = [{ type: 'RegularExpression', options: { regularExpression: '/^[a-z]+$/' } }];
      expect(runValidators(rules, '')).toHaveLength(0);
    });

    it('passes when value matches pattern', () => {
      const rules: ValidatorRule[] = [{ type: 'RegularExpression', options: { regularExpression: '/^[a-z]+$/' } }];
      expect(runValidators(rules, 'abc')).toHaveLength(0);
    });

    it('fails when value does not match', () => {
      const rules: ValidatorRule[] = [{ type: 'RegularExpression', options: { regularExpression: '/^[a-z]+$/' } }];
      expect(runValidators(rules, 'ABC123')).toHaveLength(1);
    });

    it('supports regex flags', () => {
      const rules: ValidatorRule[] = [{ type: 'RegularExpression', options: { regularExpression: '/^[a-z]+$/i' } }];
      expect(runValidators(rules, 'ABC')).toHaveLength(0);
    });

    it('passes gracefully for missing pattern', () => {
      const rules: ValidatorRule[] = [{ type: 'RegularExpression', options: {} }];
      expect(runValidators(rules, 'anything')).toHaveLength(0);
    });

    it('passes for non-delimited pattern (no PCRE delimiters)', () => {
      const rules: ValidatorRule[] = [{ type: 'RegularExpression', options: { regularExpression: '[a-z]+' } }];
      expect(runValidators(rules, 'anything')).toHaveLength(0);
    });
  });

  describe('DateRange', () => {
    it('passes when empty', () => {
      const rules: ValidatorRule[] = [{ type: 'DateRange', options: { minimum: '2024-01-01' } }];
      expect(runValidators(rules, '')).toHaveLength(0);
    });

    it('fails for invalid date string', () => {
      const rules: ValidatorRule[] = [{ type: 'DateRange' }];
      expect(runValidators(rules, 'not-a-date')).toHaveLength(1);
    });

    it('fails when before minimum', () => {
      const rules: ValidatorRule[] = [{ type: 'DateRange', options: { minimum: '2024-06-01' } }];
      expect(runValidators(rules, '2024-01-15')).toHaveLength(1);
    });

    it('fails when after maximum', () => {
      const rules: ValidatorRule[] = [{ type: 'DateRange', options: { maximum: '2024-12-31' } }];
      expect(runValidators(rules, '2025-06-01')).toHaveLength(1);
    });

    it('passes when within range', () => {
      const rules: ValidatorRule[] = [{ type: 'DateRange', options: { minimum: '2024-01-01', maximum: '2024-12-31' } }];
      expect(runValidators(rules, '2024-06-15')).toHaveLength(0);
    });
  });

  describe('Multiple validators combined', () => {
    it('collects errors from all failing validators', () => {
      const rules: ValidatorRule[] = [
        { type: 'NotEmpty' },
        { type: 'EmailAddress' },
      ];
      const result = runValidators(rules, '');
      expect(result).toHaveLength(1); // only NotEmpty fails (EmailAddress skips empty)
    });

    it('required + string length both checked', () => {
      const rules: ValidatorRule[] = [
        { type: 'NotEmpty' },
        { type: 'StringLength', options: { minimum: 5, maximum: 50 } },
        { type: 'EmailAddress' },
      ];
      const result = runValidators(rules, 'ab');
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('all pass when value is fully valid', () => {
      const rules: ValidatorRule[] = [
        { type: 'NotEmpty' },
        { type: 'StringLength', options: { minimum: 5, maximum: 50 } },
        { type: 'EmailAddress' },
      ];
      expect(runValidators(rules, 'user@example.com')).toHaveLength(0);
    });
  });

  describe('Unknown validator', () => {
    it('skips unknown validator types gracefully', () => {
      const rules: ValidatorRule[] = [{ type: 'NonExistentValidator' }];
      expect(runValidators(rules, 'hello')).toHaveLength(0);
    });
  });
});
