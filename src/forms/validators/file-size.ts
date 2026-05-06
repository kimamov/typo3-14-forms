import type { Validator, ValidatorResult } from '../types';

const SIZE_UNITS: Record<string, number> = {
  B: 1,
  K: 1024,
  M: 1024 * 1024,
  G: 1024 * 1024 * 1024,
};

function parseSize(input: string): number {
  const match = input.trim().toUpperCase().match(/^(\d+(?:\.\d+)?)\s*([BKMG])?$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2] ?? 'B';
  return value * (SIZE_UNITS[unit] ?? 1);
}

/**
 * Client-side file size validation reads from the File API.
 * The `value` parameter is ignored; pass the input element's files via options.__files.
 */
export const fileSize: Validator = {
  type: 'FileSize',
  validate(_value: string, options: Record<string, unknown>): ValidatorResult {
    const files = options['__files'] as FileList | undefined;
    if (!files || files.length === 0) {
      return { valid: true, message: '' };
    }

    const customMsg = options.message as string | undefined;
    const minStr = String(options['minimum'] ?? '0B');
    const maxStr = String(options['maximum'] ?? '');
    const min = parseSize(minStr);
    const max = maxStr ? parseSize(maxStr) : Infinity;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size < min) {
        return { valid: false, message: customMsg ?? `File "${file.name}" is too small. Minimum: ${minStr}.` };
      }
      if (file.size > max) {
        return { valid: false, message: customMsg ?? `File "${file.name}" is too large. Maximum: ${maxStr}.` };
      }
    }

    return { valid: true, message: '' };
  },
};
