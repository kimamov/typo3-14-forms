---
title: TYPO3 Setup
description: One-call setup for TYPO3 EXT:form with AJAX submit, plugins, and hooks.
---

The TYPO3 integration layer wraps the generic Formz library with TYPO3-specific defaults. A single `initTypo3Forms()` call handles everything.

## Basic Setup

```typescript
import { initTypo3Forms } from 'formz';

const api = initTypo3Forms();
```

This does:

1. Registers all 12 built-in validators
2. Registers the combobox, datepicker, and client-variants plugins
3. Creates an AJAX submit handler that sends `X-Form-Ajax: 1` and handles the TYPO3 `AjaxFormResponse` JSON
4. Scans for `form[id]` elements and initializes each one
5. Returns a `Typo3FormsApi` object for cleanup

## Configuration Options

```typescript
const api = initTypo3Forms({
  // Skip built-in validators (if you only want custom ones)
  disableDefaultValidators: false,

  // Add custom validators
  additionalValidators: [
    {
      type: 'PhoneNumber',
      validate(value, options) {
        if (!value) return { valid: true, message: '' };
        const valid = /^\+?\d[\d\s\-()]{6,}$/.test(value);
        return { valid, message: valid ? '' : (options['message'] as string) ?? 'Invalid phone number' };
      },
    },
  ],

  // Add custom field plugins
  additionalFieldPlugins: {
    'color-picker': () => import('./plugins/color-picker'),
  },

  // Add custom form plugins
  additionalFormPlugins: [
    () => import('./plugins/form-analytics'),
  ],

  // Override the submit function entirely
  // onSubmit: myCustomSubmitFn,

  // Custom selectors (defaults shown)
  formSelector: 'form[id]',
  fieldSelector: '[data-form-field]',

  // Lifecycle hooks
  hooks: {
    onFormRegistered(api) {
      console.log(`Form "${api.id}" ready`);
    },
    onBeforeSubmit(ctx) {
      console.log('Submitting:', ctx.formEl.id);
      // Return false to cancel the submit
    },
    onAfterSubmit(response, formEl) {
      console.log('Server responded:', response);
    },
    onValidationError(errors, formEl) {
      console.log('Validation failed:', errors);
    },
    onStepChange(page, formEl) {
      console.log(`Step ${page.current} of ${page.total}`);
    },
    onFormFinished(response, formEl) {
      console.log('Form complete!');
    },
    onSubmitError(error, formEl) {
      console.error('Submit failed:', error);
    },
  },
});
```

## Lifecycle Hooks

All hooks are optional and fire at specific points in the submit flow:

| Hook | When | Can cancel? |
|------|------|-------------|
| `onFormRegistered` | Form controller created and ready | No |
| `onBeforeSubmit` | Before AJAX request is sent | Yes (return `false`) |
| `onAfterSubmit` | After response JSON is parsed, before any action | No |
| `onValidationError` | Server returned validation errors | No |
| `onStepChange` | Multistep form advanced to next page | No |
| `onFormFinished` | Server indicated form is complete | No |
| `onSubmitError` | Network failure, non-OK status, or invalid JSON | No |

## AJAX Submit Flow

The TYPO3 submit handler (`createTypo3Submit`) follows this flow:

```
User clicks Submit
  → onBeforeSubmit hook (return false to cancel)
  → POST to form action with X-Form-Ajax: 1 header
  → Check response.ok (fallback to native on error)
  → Parse JSON as Typo3AjaxFormResponse
  → onAfterSubmit hook
  → If !valid: apply field errors + onValidationError
  → If finished: onFormFinished → redirect or replace form
  → If multistep: replace HTML + update state + onStepChange
```

## Expected Server Response

The AJAX handler expects this JSON structure from the server:

```typescript
interface AjaxFormResponse {
  valid: boolean;
  errors: Record<string, string[]>;    // field name → error messages
  page: { current: number; total: number };
  finished: boolean;
  redirect: string | null;
  message: string | null;             // HTML to replace form on finish
  state: string;                      // hidden state field value
  html?: string;                      // next step HTML (multistep)
}
```

## Cleanup

Call `destroy()` to unregister all forms and clean up listeners:

```typescript
const api = initTypo3Forms();

// Later...
api.destroy();
```

After `destroy()`, you can call `initTypo3Forms()` again (e.g., after a full page AJAX replacement).

## Using the Registry Directly

The returned `api.registry` gives you full access to the `FormRegistry`:

```typescript
const api = initTypo3Forms();

// Get a specific form controller
const form = api.registry.get('my-form-id');
form?.on('form:valid', () => console.log('Valid!'));

// Register a late form manually
const lateForm = document.getElementById('dynamic-form') as HTMLFormElement;
api.registry.register(lateForm, createTypo3Submit());
```
