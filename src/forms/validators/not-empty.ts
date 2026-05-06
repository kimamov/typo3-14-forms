import type { Validator, ValidatorResult } from '../types';

export const notEmpty: Validator = {
  type: 'NotEmpty',
  validate(value: string, options: Record<string, unknown>): ValidatorResult {
    const valid = value.trim().length > 0;
    return {
      valid,
      message: valid ? '' : (options.message as string) ?? 'This field is required.',
    };
  },
};
