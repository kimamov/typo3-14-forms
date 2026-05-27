---
title: FieldController
description: API reference for individual field controllers.
---

A `FieldController` wraps a single form field (a `[data-form-field]` wrapper containing an `input`, `select`, or `textarea`). Get one via `initField()` or interact with fields through the parent form controller.

## Constructor

```typescript
new FieldController(wrapper: HTMLElement, options?: FieldControllerOptions)
```

Usually created via `initField()` rather than directly.

## Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | `string` | The `data-form-field` attribute value |
| `state` | `FieldState` | Cloned snapshot of current state |
| `element` | `HTMLElement` | The wrapper element |
| `inputElement` | `HTMLInputElement \| HTMLSelectElement \| HTMLTextAreaElement` | The active input |
| `fieldType` | `string \| null` | The `data-field-type` attribute, or null |
| `enabled` | `boolean` | Whether the field is enabled |

## Methods

### `setValue(value)`

Sets the input value, marks as dirty/touched, validates, and notifies listeners.

### `validate()`

Runs validation and returns a `FieldValidationResult`.

```typescript
const result = ctrl.validate();
// { isValid: boolean, errors: string[] }
```

### `setServerErrors(errors)`

Applies server-side validation errors. Errors persist until the value changes.

```typescript
ctrl.setServerErrors(['This email is already registered']);
```

### `setEnabled(enabled)`

Shows/hides the field, enables/disables the input, and excludes from validation when disabled.

### `reset()`

Restores the input to its default DOM value (`defaultValue`, `defaultChecked`, `defaultSelected`) and clears validation state.

### `destroy()`

Destroys the plugin, aborts listeners, restores native validation attributes.

### `attachPlugin(plugin)`

Attaches a `FieldPlugin`. Destroys any previously attached plugin first. Skipped if the controller is already destroyed.

### `replaceInput(newInput)`

Allows a plugin to swap the active input element (e.g., combobox hides the select and uses a text input).

### `on(event, handler)` / `once(event, handler)` / `off(event, handler)`

Field-level events.

```typescript
ctrl.on('change', (state: FieldState) => { ... });
ctrl.on('valid', (state: FieldState) => { ... });
ctrl.on('invalid', (state: FieldState) => { ... });
```

## FieldControllerOptions

```typescript
interface FieldControllerOptions {
  validate?(
    value: string,
    rules: ValidatorRule[],
    defaultValidate: () => FieldValidationResult
  ): FieldValidationResult;

  onServerErrors?(errors: string[], fieldName: string): string[];

  renderErrors?(errors: string[], ctx: FieldController): void;
}
```

### `validate`

Override the validation pipeline. Receives the current value, parsed rules, and a `defaultValidate` function you can call to run the standard validators. Return a `FieldValidationResult`.

### `onServerErrors`

Transform or filter server errors before they are applied. Return the modified array.

### `renderErrors`

Replace the default error rendering. Called with the error array and the field controller instance. When provided, the default `innerHTML` writing to the errors element is skipped.

## FieldValidationResult

```typescript
interface FieldValidationResult {
  isValid: boolean;
  errors: string[];
}
```
