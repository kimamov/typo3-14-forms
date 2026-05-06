import type { Validator, ValidatorResult } from '../types';

export const float: Validator = {
  type: 'Float',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const valid = !Number.isNaN(Number(value.trim())) && value.trim() !== '';
    return {
      valid,
      message: valid ? '' : (options.message as string) ?? 'Please enter a valid number.',
    };
  },
};
