import type { Validator, ValidatorResult } from '../types';

export const dateRange: Validator = {
  type: 'DateRange',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const customMsg = options.message as string | undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { valid: false, message: customMsg ?? 'Please enter a valid date.' };
    }

    const minStr = options['minimum'] as string | undefined;
    const maxStr = options['maximum'] as string | undefined;

    if (minStr) {
      const min = new Date(minStr);
      if (!Number.isNaN(min.getTime()) && date < min) {
        return { valid: false, message: customMsg ?? `The date must not be before ${minStr}.` };
      }
    }

    if (maxStr) {
      const max = new Date(maxStr);
      if (!Number.isNaN(max.getTime()) && date > max) {
        return { valid: false, message: customMsg ?? `The date must not be after ${maxStr}.` };
      }
    }

    return { valid: true, message: '' };
  },
};
