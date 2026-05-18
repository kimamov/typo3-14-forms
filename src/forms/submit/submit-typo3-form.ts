import { createTypo3Submit } from '../../typo3/submit';
import type { FormSubmitFunction } from '../types';

/**
 * @deprecated Use `createTypo3Submit()` from `typo3/submit` instead, which
 * supports lifecycle hooks and multistep HTML replacement.
 */
export const submitTypo3Form: FormSubmitFunction = createTypo3Submit();
