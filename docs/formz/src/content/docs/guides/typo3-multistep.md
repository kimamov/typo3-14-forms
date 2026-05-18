---
title: Multistep Forms
description: TYPO3 multistep form support with AJAX page transitions.
---

TYPO3 EXT:form supports multistep (multi-page) forms. The Formz TYPO3 layer handles step transitions via AJAX without full page reloads.

## How It Works

1. User submits step 1
2. Server validates and returns `{ valid: true, finished: false, html: "...", state: "...", page: { current: 2, total: 3 } }`
3. Formz replaces the form content with the new HTML
4. The `MutationObserver` in `FormController` automatically destroys old fields and discovers new ones
5. Plugins (combobox, datepicker, client-variants) are re-initialized on the new fields
6. The hidden `[__state]` field is updated
7. User continues to step 2, and so on...
8. On the final step, server returns `{ finished: true }` with either a `redirect` URL or a `message` (HTML) to replace the form

## Server Response for Each Step

### Validation failure (stay on current step)

```json
{
  "valid": false,
  "errors": {
    "firstName": ["First name is required"],
    "email": ["Please enter a valid email"]
  },
  "page": { "current": 1, "total": 3 },
  "finished": false,
  "redirect": null,
  "message": null,
  "state": "abc123..."
}
```

### Step advance (go to next step)

```json
{
  "valid": true,
  "errors": {},
  "page": { "current": 2, "total": 3 },
  "finished": false,
  "redirect": null,
  "message": null,
  "state": "def456...",
  "html": "<div data-form-field=\"address\">...</div><button type=\"submit\">Next</button>"
}
```

### Final submission (redirect)

```json
{
  "valid": true,
  "errors": {},
  "page": { "current": 3, "total": 3 },
  "finished": true,
  "redirect": "/thank-you",
  "message": null,
  "state": "ghi789..."
}
```

### Final submission (inline message)

```json
{
  "valid": true,
  "errors": {},
  "page": { "current": 3, "total": 3 },
  "finished": true,
  "redirect": null,
  "message": "<div class=\"success\"><h2>Thank you!</h2><p>We will be in touch.</p></div>",
  "state": "ghi789..."
}
```

## Step Progress Indicator

Use the `onStepChange` hook to build a progress indicator:

```typescript
initTypo3Forms({
  hooks: {
    onStepChange(page, formEl) {
      const indicator = formEl.closest('.form-wrapper')?.querySelector('.step-indicator');
      if (!indicator) return;

      indicator.textContent = `Step ${page.current} of ${page.total}`;

      const progress = formEl.closest('.form-wrapper')?.querySelector('progress');
      if (progress) {
        progress.max = page.total;
        progress.value = page.current;
      }
    },
  },
});
```

```html
<div class="form-wrapper">
  <div class="step-indicator">Step 1 of 3</div>
  <progress value="1" max="3"></progress>

  <form id="multistep-form" action="/api/form/submit" method="post">
    <input type="hidden" name="tx_form_formframework[__state]" value="..." />

    <div data-form-field="firstName"
         data-validate='[{"type":"NotEmpty","options":{"message":"First name is required"}}]'>
      <label for="firstName">First Name</label>
      <input id="firstName" name="firstName" />
      <div id="firstName-errors" class="invalid-feedback"></div>
    </div>

    <div data-form-field="lastName"
         data-validate='[{"type":"NotEmpty","options":{"message":"Last name is required"}}]'>
      <label for="lastName">Last Name</label>
      <input id="lastName" name="lastName" />
      <div id="lastName-errors" class="invalid-feedback"></div>
    </div>

    <button type="submit">Next</button>
  </form>
</div>
```

## Scroll to Top on Step Change

```typescript
initTypo3Forms({
  hooks: {
    onStepChange(page, formEl) {
      formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  },
});
```

## Loading State During Transitions

```typescript
initTypo3Forms({
  hooks: {
    onBeforeSubmit(ctx) {
      ctx.formEl.classList.add('is-loading');
      const btn = ctx.formEl.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) btn.disabled = true;
    },
    onAfterSubmit(response, formEl) {
      formEl.classList.remove('is-loading');
      const btn = formEl.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) btn.disabled = false;
    },
    onSubmitError(error, formEl) {
      formEl.classList.remove('is-loading');
      const btn = formEl.querySelector('button[type="submit"]') as HTMLButtonElement;
      if (btn) btn.disabled = false;
    },
  },
});
```
