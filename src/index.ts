export { formRegistry } from './forms/registry';
export { FormRegistry } from './forms/registry';
export { registerPlugin } from './forms/plugins/index';
export { hasPlugin, unregisterPlugin } from './forms/plugins/index';
export { registerDefaultValidators, registerValidator } from './forms/validators';
export { ClientVariantsPlugin } from './forms/plugins/client-variants/index';
export { createTypo3Submit } from './typo3/submit';
export { initField } from './forms/init-field';
export type { InitFieldOptions, PluginArg } from './forms/init-field';
export { initTypo3Forms } from './typo3/index';

export type {
  FieldPlugin,
  FieldPluginFactory,
  FieldPluginHost,
  FormPlugin,
  FormPluginFactory,
  FormPluginHost,
  ClientVariant,
  FormSubmitContext,
  FormSubmitActions,
  FormSubmitFunction,
  FormControllerApi,
  FormState,
  FieldState,
  FormEventType,
  RegistryEventType,
  FieldEventDetail,
  FormEventDetail,
  FieldEventHandler,
  FormLevelEventHandler,
  FormEventHandler,
  RegistryEventHandler,
  Validator,
  ValidatorRule,
  ValidatorResult,
  AjaxFormResponse,
  FieldControllerEventType,
  FieldControllerEventHandler,
} from './forms/types';

export type { FieldControllerOptions, FieldValidationResult } from './forms/field-controller';
export type { FormControllerOptions } from './forms/form-controller';
export type { Typo3FormsOptions, Typo3FormsHooks, Typo3AjaxFormResponse, Typo3FormsApi } from './typo3/types';
