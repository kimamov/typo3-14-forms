import type { FormSubmitFunction } from '../forms/types';
import type { Typo3AjaxFormResponse, Typo3FormsHooks, Typo3RemountFn, Typo3UnmountFn } from './types';

function updateHiddenField(formEl: HTMLFormElement, selector: string, value: string): void {
  const input = formEl.querySelector<HTMLInputElement>(selector);
  if (input) {
    input.value = value;
  }
}

export interface Typo3SubmitDeps {
  remount?: Typo3RemountFn;
  unmount?: Typo3UnmountFn;
}

export function createTypo3Submit(hooks?: Typo3FormsHooks, deps?: Typo3SubmitDeps): FormSubmitFunction {
  return async (ctx) => {
    const { formEl, formData, signal, fallbackToNative, applyValidationErrors, redirect } = ctx;

    if (hooks?.onBeforeSubmit?.(ctx) === false) {
      return;
    }

    let response: Response;
    try {
      response = await fetch(formEl.action, {
        method: 'POST',
        headers: { 'X-Form-Ajax': '1' },
        body: formData,
        signal,
      });
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.warn('[Typo3Forms] AJAX submit failed:', err);
        hooks?.onSubmitError?.(err as Error, formEl);
        fallbackToNative();
      }
      return;
    }

    if (!response.ok) {
      const err = new Error(`Server responded with ${response.status}`);
      console.warn(`[Typo3Forms] ${err.message}, falling back to normal submit`);
      hooks?.onSubmitError?.(err, formEl);
      fallbackToNative();
      return;
    }

    let data: Typo3AjaxFormResponse;
    try {
      data = await response.json();
    } catch {
      console.warn('[Typo3Forms] Invalid JSON response, falling back to normal submit');
      hooks?.onSubmitError?.(new Error('Invalid JSON response'), formEl);
      fallbackToNative();
      return;
    }

    hooks?.onAfterSubmit?.(data, formEl);

    if (!data.valid) {
      if (data.state) {
        updateHiddenField(formEl, 'input[name$="[__state]"]', data.state);
      }
      applyValidationErrors(data.errors);
      hooks?.onValidationError?.(data.errors, formEl);
      return;
    }

    if (data.finished) {
      hooks?.onFormFinished?.(data, formEl);
      if (data.redirect) {
        redirect(data.redirect);
        return;
      }
      deps?.unmount?.(formEl);
      if (data.message) {
        formEl.outerHTML = data.message;
      }
      return;
    }

    if (data.html && deps?.remount) {
      const newFormEl = deps.remount(formEl, data.html);
      hooks?.onStepChange?.(data.page, newFormEl ?? formEl);
    } else {
      if (data.state) {
        updateHiddenField(formEl, 'input[name$="[__state]"]', data.state);
      }
      hooks?.onStepChange?.(data.page, formEl);
    }
  };
}
