---
title: TYPO3 Setup
description: One-call setup for TYPO3 EXT:form with AJAX submit, plugins, and hooks.
---

The TYPO3 integration layer wraps the generic FormLayer library with TYPO3-specific defaults. A single `initTypo3Forms()` call handles everything.

## Basic Setup

### Frontend

```typescript
import { initTypo3Forms } from 'formlayer';

const api = initTypo3Forms();
```

### Backend

Enable **Use AJAX submission** on the form content element in the TYPO3 backend (FlexForm checkbox). This activates the custom Fluid templates and hidden fields required for AJAX.

See [TYPO3 Backend (PHP)](/guides/typo3-backend/) for middleware, templates, and server-side configuration.

## What initTypo3Forms Does

1. Registers all 12 built-in validators
2. Registers combobox, datepicker, altcha, and client-variants plugins
3. Creates an AJAX submit handler (`createTypo3Submit`) that sends `X-Form-Ajax: 1`
4. Provides `remount` and `unmount` for multistep form lifecycle
5. Scans for `form[id]` elements and initializes each one
6. Returns a `Typo3FormsApi` object for cleanup

## Configuration Options

```typescript
const api = initTypo3Forms({
  disableDefaultValidators: false,

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

  additionalFieldPlugins: {
    'color-picker': () => import('./plugins/color-picker'),
  },

  additionalFormPlugins: [
    () => import('./plugins/form-analytics'),
  ],

  // Override the submit function entirely
  // onSubmit: myCustomSubmitFn,

  formSelector: 'form[id]',
  fieldSelector: '[data-form-field]',

  hooks: {
    onFormRegistered(api) {
      console.log(`Form "${api.id}" ready`);
    },
    onBeforeSubmit(ctx) {
      return false; // cancel submit
    },
    onAfterSubmit(response, formEl) { /* ... */ },
    onValidationError(errors, formEl) { /* ... */ },
    onStepChange(page, formEl) { /* new form element after remount */ },
    onFormFinished(response, formEl) { /* ... */ },
    onSubmitError(error, formEl) { /* ... */ },
  },
});
```

## Lifecycle Hooks

| Hook | When | Can cancel? |
|------|------|-------------|
| `onFormRegistered` | Form controller created (also after remount) | No |
| `onBeforeSubmit` | Before AJAX request is sent | Yes (return `false`) |
| `onAfterSubmit` | After response JSON is parsed | No |
| `onValidationError` | Server returned validation errors | No |
| `onStepChange` | Multistep form advanced; receives remounted form element | No |
| `onFormFinished` | Server indicated form is complete | No |
| `onSubmitError` | Network failure, non-OK status, or invalid JSON | No |

## AJAX Submit Flow

```
User clicks Submit
  → Client validation (FormController)
  → data-loading on submit button (default)
  → onBeforeSubmit hook (return false to cancel)
  → POST with X-Form-Ajax: 1 header
  → AjaxFormSubmitMiddleware (PHP) returns JSON
  → onAfterSubmit hook
  → If !valid: update __state + apply field errors + onValidationError
  → If finished: onFormFinished → unmount → redirect or replace with message
  → If multistep: remount (outerHTML) + onStepChange
```

## Form Lifecycle: Remount and Unmount

TYPO3 multistep forms use registry-level lifecycle management instead of generic `FormController` methods:

| Action | When | What happens |
|--------|------|--------------|
| **remount** | Valid step with `html` in response | Unregister old form → replace `outerHTML` → register new form |
| **unmount** | Form finished (no redirect) | Unregister form → replace with finisher `message` HTML |

This ensures plugins, event listeners, and field controllers are properly destroyed before DOM replacement.

Generic `finish()` from `FormSubmitContext` is **not** used by the TYPO3 submit handler. Cleanup goes through `unmount` instead.

## Expected Server Response

```typescript
interface Typo3AjaxFormResponse {
  valid: boolean;
  errors: Record<string, string[]>;
  page: { current: number; total: number };
  finished: boolean;
  redirect: string | null;
  message: string | null;   // finisher HTML
  state: string;              // HMAC-protected FormState
  html?: string | null;       // full <form> HTML for next step
}
```

## Loading State

Submit buttons get `data-loading` automatically via the generic FormController. Style with CSS:

```css
.t3-form button[data-loading] {
  opacity: 0.6;
  pointer-events: none;
}
```

See [Loading State](/guides/loading-state/) for customization.

## Cleanup

```typescript
const api = initTypo3Forms();
api.destroy(); // unregisters all forms, removes listeners
```

After `destroy()`, you can call `initTypo3Forms()` again.

## Using the Registry Directly

```typescript
const api = initTypo3Forms();

const form = api.registry.get('my-form-id');
form?.on('form:loading', (detail) => {
  console.log('Submitting:', detail.state.isSubmitting);
});

// Manual registration (uses same submitFn as init)
const lateForm = document.getElementById('dynamic-form') as HTMLFormElement;
api.registry.register(lateForm, createTypo3Submit());
```

## Related Guides

- [Multistep Forms](/guides/typo3-multistep/) — step transitions, summary steps, remounting
- [TYPO3 Backend (PHP)](/guides/typo3-backend/) — middleware, FlexForm, Fluid templates
- [Loading State](/guides/loading-state/) — submit button loading UI
