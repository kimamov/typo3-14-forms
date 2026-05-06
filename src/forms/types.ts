export interface ValidatorRule {
  type: string;
  options?: Record<string, unknown>;
}

export interface ValidatorResult {
  valid: boolean;
  message: string;
}

export interface Validator {
  type: string;
  validate(value: string, options: Record<string, unknown>): ValidatorResult;
}

export interface FieldState {
  name: string;
  value: string;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
}

export interface FormState {
  id: string;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  fields: Record<string, FieldState>;
}

export type FormEventType =
  | 'field:valid'
  | 'field:invalid'
  | 'field:change'
  | 'field:added'
  | 'field:removed'
  | 'form:valid'
  | 'form:invalid'
  | 'form:submit'
  | 'form:reset';

export type RegistryEventType = 'form:registered' | 'form:unregistered';

export interface FieldEventDetail {
  formId: string;
  fieldName: string;
  state: FieldState;
}

export interface FormEventDetail {
  formId: string;
  state: FormState;
}

export type FormEventHandler = (detail: FieldEventDetail | FormEventDetail) => void;
export type RegistryEventHandler = (detail: { formId: string }) => void;

export interface FormControllerApi {
  readonly id: string;
  getField(name: string): FieldState | undefined;
  getState(): FormState;
  validate(): Promise<boolean>;
  reset(): void;
  destroy(): void;
  on(event: FormEventType, handler: FormEventHandler): void;
  off(event: FormEventType, handler: FormEventHandler): void;
}

export interface FieldPlugin {
  init(wrapper: HTMLElement, fieldController: FieldPluginHost): void | Promise<void>;
  destroy(): void;
}

export interface FormPlugin {
  init(formEl: HTMLFormElement, api: FormPluginHost): void | Promise<void>;
  destroy(): void;
}

export interface FormPluginHost {
  readonly id: string;
  getFieldValue(name: string): string | undefined;
  getFieldNames(): string[];
  setFieldEnabled(name: string, enabled: boolean): void;
  on(event: FormEventType, handler: FormEventHandler): void;
  off(event: FormEventType, handler: FormEventHandler): void;
}

export interface ClientVariant {
  condition: string;
  enabled?: boolean;
}

export interface FieldPluginHost {
  readonly name: string;
  readonly inputElement: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  readonly element: HTMLElement;
  setValue(value: string): void;
  validate(): void;
  replaceInput(newInput: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void;
}

export type FieldPluginFactory = () => Promise<{ default: new () => FieldPlugin }>;
export type FormPluginFactory = () => Promise<{ default: new () => FormPlugin }>;

export const CSS_CLASSES = {
  errorClass: 'is-invalid',
  errorMsgClass: 'invalid-feedback',
  descriptionClass: 'form-text',
} as const;

export const SELECTORS = {
  formField: '[data-form-field]',
  input: 'input, select, textarea',
} as const;

export const DEBOUNCE_MS = 300;

export interface AjaxFormResponse {
  valid: boolean;
  errors: Record<string, string[]>;
  page: { current: number; total: number };
  finished: boolean;
  redirect: string | null;
  message: string | null;
  state: string;
}

export interface FormSubmitActions {
  /** Allow the browser to submit the form natively (bypasses JS handling). */
  fallbackToNative(): void;
  /** Apply server-side field validation errors and focus the first invalid field. */
  applyValidationErrors(errors: Record<string, string[]>): void;
  /** Advance a multi-step form to the next page by updating the hidden state field. */
  nextStep(state: string): void;
  /** Navigate to a URL after successful submission. */
  redirect(url: string): void;
  /** Replace the form element with the provided HTML after final submission. */
  finish(html?: string): void;
}

//@TODO: make we want to pass the entire FormController to give full access
export interface FormSubmitContext extends FormSubmitActions {
  formEl: HTMLFormElement;
  formData: FormData;
  submitter: HTMLElement | null;
  signal: AbortSignal;
}

export type FormSubmitFunction = (context: FormSubmitContext) => Promise<void>;
