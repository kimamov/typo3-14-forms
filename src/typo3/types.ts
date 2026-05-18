import type {
  Validator,
  FormSubmitFunction,
  FormSubmitContext,
  AjaxFormResponse,
  FormControllerApi,
  FieldPluginFactory,
  FormPluginFactory,
} from '../forms/types';
import type { FormRegistry } from '../forms/registry';

export interface Typo3FormsOptions {
  disableDefaultValidators?: boolean;
  additionalValidators?: Validator[];
  additionalFieldPlugins?: Record<string, FieldPluginFactory>;
  additionalFormPlugins?: FormPluginFactory[];
  onSubmit?: FormSubmitFunction;
  formSelector?: string;
  fieldSelector?: string;
  hooks?: Typo3FormsHooks;
}

export interface Typo3FormsHooks {
  onFormRegistered?(api: FormControllerApi): void;
  onBeforeSubmit?(context: FormSubmitContext): boolean | void;
  onAfterSubmit?(response: Typo3AjaxFormResponse, formEl: HTMLFormElement): void;
  onStepChange?(page: { current: number; total: number }, formEl: HTMLFormElement): void;
  onFormFinished?(response: Typo3AjaxFormResponse, formEl: HTMLFormElement): void;
  onValidationError?(errors: Record<string, string[]>, formEl: HTMLFormElement): void;
  onSubmitError?(error: Error, formEl: HTMLFormElement): void;
}

export interface Typo3AjaxFormResponse extends AjaxFormResponse {
  html?: string;
}

export interface Typo3FormsApi {
  registry: FormRegistry;
  destroy(): void;
}
