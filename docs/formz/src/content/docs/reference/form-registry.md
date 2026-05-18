---
title: FormRegistry
description: API reference for the FormRegistry class.
---

The `FormRegistry` manages all form controllers. Access via the exported `formRegistry` singleton.

```typescript
import { formRegistry } from 'formz';
```

## Methods

### `init(submitFn, root?, formSelector?, controllerOptions?)`

Discovers and registers all matching forms.

```typescript
formRegistry.init(
  submitFn: FormSubmitFunction,
  root?: ParentNode,           // default: document
  formSelector?: string,       // default: 'form[id]'
  controllerOptions?: FormControllerOptions
): void
```

### `register(formEl, submitFn, controllerOptions?)`

Registers a single form element. Returns the form controller API. No-ops if already registered.

```typescript
const api: FormControllerApi = formRegistry.register(formEl, submitFn);
```

### `unregister(formId)`

Destroys the controller and removes the form from the registry.

```typescript
formRegistry.unregister('my-form');
```

### `get(formId)`

Returns the `FormControllerApi` for a registered form, or `undefined`.

```typescript
const form = formRegistry.get('contact');
```

### `getAll()`

Returns a `Map<string, FormControllerApi>` of all registered forms.

### `on(event, handler)` / `off(event, handler)`

Subscribe to registry-level events.

```typescript
formRegistry.on('form:registered', ({ formId }) => { ... });
formRegistry.on('form:unregistered', ({ formId }) => { ... });
```

### `registerValidator(validator)`

Registers a validator globally.

```typescript
formRegistry.registerValidator({
  type: 'MyValidator',
  validate(value, options) { ... }
});
```

### `registerPlugin(type, factory)` / `unregisterPlugin(type)` / `hasPlugin(type)`

Manage the field plugin registry.

```typescript
formRegistry.registerPlugin('slider', () => import('./plugins/slider'));
formRegistry.hasPlugin('slider');    // true
formRegistry.unregisterPlugin('slider');
```

### `registerFormPlugin(factory)`

Registers a form-level plugin factory. Applied to all forms registered after this call.

```typescript
formRegistry.registerFormPlugin(() => import('./plugins/analytics'));
```

## Global Access

The registry is also available globally as `window.__FormsModule` (browser environments only).
