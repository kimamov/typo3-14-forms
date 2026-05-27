---
title: Loading State
description: Reflect form submission loading on the submit button with built-in defaults and hooks.
---

When a form is submitted, FormLayer tracks `isSubmitting` on the form state. By default, the clicked submit button gets a `data-loading` attribute while submission is in progress.

This covers client-side validation, the async submit function, and any network round-trip — until the submit handler completes or the controller is destroyed.

## Default Behavior

No configuration is required. On submit:

1. `isSubmitting` becomes `true`
2. The clicked button (`SubmitEvent.submitter`) receives `data-loading`
3. When submission finishes (success, validation error, or server error), `data-loading` is removed

Style it in CSS:

```css
button[data-loading] {
  opacity: 0.6;
  pointer-events: none;
}

button[data-loading]::after {
  content: ' …';
}
```

If no submitter is available (e.g. programmatic `form.submit()`), FormLayer falls back to the first submit button in the form.

## FormController Options

Pass options when registering a form:

```typescript
import { formRegistry } from 'formlayer';

formRegistry.register(formEl, submitFn, {
  loadingState: {
    attribute: 'data-loading', // default
    submitSelector: 'button[type="submit"], input[type="submit"]', // fallback
  },
  onLoadingStateChange(detail) {
    console.log('Loading:', detail.isSubmitting, detail.submitter);
  },
});
```

### Disable Built-in UI

Set `loadingState: false` to skip the default attribute toggle. The hook and `form:loading` event still fire if configured:

```typescript
formRegistry.register(formEl, submitFn, {
  loadingState: false,
  onLoadingStateChange({ isSubmitting, submitter }) {
    submitter?.classList.toggle('is-busy', isSubmitting);
  },
});
```

### Custom Attribute

Use a different attribute name:

```typescript
formRegistry.register(formEl, submitFn, {
  loadingState: { attribute: 'aria-busy' },
});
```

## Events

Subscribe to `form:loading` for loading transitions:

```typescript
form.on('form:loading', (detail) => {
  if (detail.state.isSubmitting) {
    console.log('Submission started');
  } else {
    console.log('Submission finished');
  }
});
```

| Event | When |
|-------|------|
| `form:submit` | Submit triggered, before validation (`isSubmitting` is already `true`) |
| `form:loading` | Whenever `isSubmitting` changes (`true` at start, `false` at end) |

`form:loading` is the reliable signal for both start and end. `form:submit` only fires once at the beginning.

## FormLoadingStateDetail

The `onLoadingStateChange` callback receives:

```typescript
interface FormLoadingStateDetail {
  formId: string;
  isSubmitting: boolean;
  submitter: HTMLElement | null;
  formEl: HTMLFormElement;
  state: FormState;
}
```

## Cleanup on Destroy

If a form controller is destroyed while a submission is in progress (for example during a TYPO3 remount), loading state is cleared before teardown. This prevents stale `data-loading` attributes on detached DOM nodes.

## TYPO3 Note

`initTypo3Forms()` uses the default loading behavior automatically. You do not need manual `onBeforeSubmit` / `onAfterSubmit` hooks to toggle button state unless you want custom UI beyond `data-loading`. See [Multistep Forms](/guides/typo3-multistep/) for how remounting interacts with loading state.
