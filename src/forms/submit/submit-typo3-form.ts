import type { AjaxFormResponse, FormSubmitFunction } from '../types';

export const submitTypo3Form: FormSubmitFunction = async (ctx) => {
  const { formEl, formData, signal, fallbackToNative, applyValidationErrors, nextStep, redirect, finish } = ctx;

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
      console.warn('[FormsModule] AJAX submit failed:', err);
      fallbackToNative();
    }
    return;
  }

  let data: AjaxFormResponse;
  try {
    data = await response.json();
  } catch {
    console.warn('[FormsModule] Invalid JSON response, falling back to normal submit');
    fallbackToNative();
    return;
  }

  if (!data.valid) {
    applyValidationErrors(data.errors);
    return;
  }

  if (data.finished) {
    if (data.redirect) {
      redirect(data.redirect);
      return;
    }
    finish(data.message ?? undefined);
    return;
  }

  nextStep(data.state);
};
