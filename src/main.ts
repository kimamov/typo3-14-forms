import './style.css';
import './forms/forms.css';
import { initTypo3Forms } from './typo3/index';

initTypo3Forms();

export { initTypo3Forms } from './typo3/index';
export { formRegistry } from './forms/registry';
export { registerPlugin } from './forms/plugins/index';
export { ClientVariantsPlugin } from './forms/plugins/client-variants/index';
export { submitTypo3Form } from './forms/submit/index';
export { initField } from './forms/init-field';
export type { FieldPlugin, FieldPluginFactory, FieldPluginHost, FormPlugin, FormPluginFactory, FormPluginHost, ClientVariant, FormSubmitContext, FormSubmitActions, FormSubmitFunction } from './forms/types';
export type { Typo3FormsOptions, Typo3FormsHooks, Typo3AjaxFormResponse, Typo3FormsApi } from './typo3/types';
