import type { Validator, ValidatorResult } from '../types';

export const numberRange: Validator = {
  type: 'NumberRange',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const customMsg = options.message as string | undefined;
    const num = Number(value);
    if (Number.isNaN(num)) {
      return { valid: false, message: customMsg ?? 'Please enter a valid number.' };
    }

    const min = options['minimum'] != null ? Number(options['minimum']) : -Infinity;
    const max = options['maximum'] != null ? Number(options['maximum']) : Infinity;

    if (num < min) {
      return { valid: false, message: customMsg ?? `The value must be at least ${min}.` };
    }

    if (num > max) {
      return { valid: false, message: customMsg ?? `The value must be at most ${max}.` };
    }

    return { valid: true, message: '' };
  },
};
