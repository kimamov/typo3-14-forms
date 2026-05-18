---
title: FormControllerApi
description: API reference for individual form controllers.
---

A `FormControllerApi` is returned by `formRegistry.register()` or `formRegistry.get()`. It controls a single `<form>` element.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | The form's `id` attribute |

## Methods

### `getField(name)`

Returns a snapshot of a field's state, or `undefined`.

```typescript
const field = form.getField('email');
// { name: 'email', value: 'test@...', isValid: true, isDirty: true, isTouched: true, errors: [] }
```

### `getState()`

Returns the full form state.

```typescript
const state: FormState = form.getState();
// { id: 'contact', isValid: true, isSubmitting: false, isDirty: true, fields: { ... } }
```

### `validate()`

Validates all fields. Returns a promise resolving to `true` if all fields are valid. Focuses the first invalid field.

```typescript
const isValid = await form.validate();
```

### `submit()`

Triggers a programmatic form submission (equivalent to the user clicking submit).

```typescript
form.submit();
```

### `reset()`

Resets all fields to their default DOM values and clears validation state.

```typescript
form.reset();
```

### `destroy()`

Destroys the controller, aborts listeners, disconnects the mutation observer, and destroys all plugins.

```typescript
form.destroy();
```

### `on(event, handler)` / `once(event, handler)` / `off(event, handler)`

Subscribe to form and field events. Typed overloads ensure correct handler signatures.

```typescript
// Field events receive FieldEventDetail
form.on('field:change', (detail) => {
  detail.fieldName; // string
  detail.state;     // FieldState
});

// Form events receive FormEventDetail
form.on('form:submit', (detail) => {
  detail.state;     // FormState
});

// once() fires only once then auto-removes
form.once('form:valid', (detail) => { ... });
```

## State Types

### `FormState`

```typescript
interface FormState {
  id: string;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  fields: Record<string, FieldState>;
}
```

### `FieldState`

```typescript
interface FieldState {
  name: string;
  value: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
}
```

## FormSubmitContext

The submit function receives this context object with both data and action methods:

```typescript
interface FormSubmitContext {
  formEl: HTMLFormElement;
  formData: FormData;
  submitter: HTMLElement | null;
  signal: AbortSignal;

  fallbackToNative(): void;
  applyValidationErrors(errors: Record<string, string[]>): void;
  nextStep(state: string): void;
  redirect(url: string): void;
  finish(html?: string): void;
}
```
