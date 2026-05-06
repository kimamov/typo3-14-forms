import type { Validator, ValidatorResult } from '../types';

export const dateTime: Validator = {
  type: 'DateTime',
  validate(value: string): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return { valid: false, message: 'Please enter a valid date.' };
    }

    return { valid: true, message: '' };
  },
};
