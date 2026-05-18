---
title: Types & Events
description: Complete type reference for all Formz interfaces.
---

## Event Types

### Form-Level Events (`FormEventType`)

```typescript
type FormEventType =
  | 'field:valid'    // FieldEventDetail
  | 'field:invalid'  // FieldEventDetail
  | 'field:change'   // FieldEventDetail
  | 'field:added'    // FieldEventDetail
  | 'field:removed'  // FieldEventDetail
  | 'form:valid'     // FormEventDetail
  | 'form:invalid'   // FormEventDetail
  | 'form:submit'    // FormEventDetail
  | 'form:reset';    // FormEventDetail
```

### Registry Events (`RegistryEventType`)

```typescript
type RegistryEventType = 'form:registered' | 'form:unregistered';
```

### Field-Level Events (`FieldControllerEventType`)

```typescript
type FieldControllerEventType = 'change' | 'valid' | 'invalid';
```

## Event Detail Types

```typescript
interface FieldEventDetail {
  formId: string;
  fieldName: string;
  state: FieldState;
}

interface FormEventDetail {
  formId: string;
  state: FormState;
}
```

## Handler Types

```typescript
type FieldEventHandler = (detail: FieldEventDetail) => void;
type FormLevelEventHandler = (detail: FormEventDetail) => void;
type FormEventHandler = FieldEventHandler | FormLevelEventHandler;
type RegistryEventHandler = (detail: { formId: string }) => void;
type FieldControllerEventHandler = (state: FieldState) => void;
```

## State Types

```typescript
interface FieldState {
  name: string;
  value: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
}

interface FormState {
  id: string;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  fields: Record<string, FieldState>;
}
```

## Plugin Types

```typescript
interface FieldPlugin {
  init(wrapper: HTMLElement, host: FieldPluginHost): void | Promise<void>;
  destroy(): void;
}

interface FormPlugin {
  init(formEl: HTMLFormElement, api: FormPluginHost): void | Promise<void>;
  destroy(): void;
}

type FieldPluginFactory = () => Promise<{ default: new () => FieldPlugin }>;
type FormPluginFactory = () => Promise<{ default: new () => FormPlugin }>;
```

## Plugin Host Interfaces

### FieldPluginHost

Given to field plugins during `init()`:

```typescript
interface FieldPluginHost {
  readonly name: string;
  readonly inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  readonly element: HTMLElement;
  setValue(value: string): void;
  validate(): void;
  replaceInput(newInput: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void;
  on(event: FieldControllerEventType, handler: FieldControllerEventHandler): void;
  off(event: FieldControllerEventType, handler: FieldControllerEventHandler): void;
}
```

### FormPluginHost

Given to form plugins during `init()`:

```typescript
interface FormPluginHost {
  readonly id: string;
  getFieldValue(name: string): string | undefined;
  getFieldNames(): string[];
  setFieldEnabled(name: string, enabled: boolean): void;
  on(event: 'field:*', handler: FieldEventHandler): void;
  on(event: 'form:*', handler: FormLevelEventHandler): void;
  off(event: 'field:*', handler: FieldEventHandler): void;
  off(event: 'form:*', handler: FormLevelEventHandler): void;
}
```

## Submit Types

```typescript
interface FormSubmitActions {
  fallbackToNative(): void;
  applyValidationErrors(errors: Record<string, string[]>): void;
  nextStep(state: string): void;
  redirect(url: string): void;
  finish(html?: string): void;
}

interface FormSubmitContext extends FormSubmitActions {
  formEl: HTMLFormElement;
  formData: FormData;
  submitter: HTMLElement | null;
  signal: AbortSignal;
}

type FormSubmitFunction = (context: FormSubmitContext) => Promise<void>;
```

## TYPO3 Types

```typescript
interface Typo3FormsOptions {
  disableDefaultValidators?: boolean;
  additionalValidators?: Validator[];
  additionalFieldPlugins?: Record<string, FieldPluginFactory>;
  additionalFormPlugins?: FormPluginFactory[];
  onSubmit?: FormSubmitFunction;
  formSelector?: string;
  fieldSelector?: string;
  hooks?: Typo3FormsHooks;
}

interface Typo3FormsHooks {
  onFormRegistered?(api: FormControllerApi): void;
  onBeforeSubmit?(context: FormSubmitContext): boolean | void;
  onAfterSubmit?(response: Typo3AjaxFormResponse, formEl: HTMLFormElement): void;
  onStepChange?(page: { current: number; total: number }, formEl: HTMLFormElement): void;
  onFormFinished?(response: Typo3AjaxFormResponse, formEl: HTMLFormElement): void;
  onValidationError?(errors: Record<string, string[]>, formEl: HTMLFormElement): void;
  onSubmitError?(error: Error, formEl: HTMLFormElement): void;
}

interface Typo3AjaxFormResponse {
  valid: boolean;
  errors: Record<string, string[]>;
  page: { current: number; total: number };
  finished: boolean;
  redirect: string | null;
  message: string | null;
  state: string;
  html?: string;
}

interface Typo3FormsApi {
  registry: FormRegistry;
  destroy(): void;
}
```

## Constants (internal)

These are not exported from the barrel but can be imported by path:

```typescript
const CSS_CLASSES = {
  errorClass: 'is-invalid',
  errorMsgClass: 'invalid-feedback',
  descriptionClass: 'form-text',
} as const;

const SELECTORS = {
  formField: '[data-form-field]',
  input: 'input, select, textarea',
} as const;

const DEBOUNCE_MS = 300;
```
