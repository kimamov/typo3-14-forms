import type { Validator, ValidatorResult } from '../types';

export const alphanumeric: Validator = {
  type: 'Alphanumeric',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const valid = /^[\p{L}\p{N}]*$/u.test(value);
    return {
      valid,
      message: valid ? '' : (options.message as string) ?? 'Only letters and numbers are allowed.',
    };
  },
};
