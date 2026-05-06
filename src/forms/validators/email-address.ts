import type { Validator, ValidatorResult } from '../types';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const emailAddress: Validator = {
  type: 'EmailAddress',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    if (value.length === 0) {
      return { valid: true, message: '' };
    }

    const valid = EMAIL_RE.test(value);
    return {
      valid,
      message: valid ? '' : (options.message as string) ?? 'Please enter a valid email address.',
    };
  },
};
