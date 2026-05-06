import type { Validator, ValidatorResult } from '../types';

export const integer: Validator = {
  type: 'Integer',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const valid = /^-?\d+$/.test(value.trim());
    return {
      valid,
      message: valid ? '' : (options.message as string) ?? 'Please enter a whole number.',
    };
  },
};
