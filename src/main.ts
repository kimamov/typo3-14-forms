import './style.css';
import './forms/forms.css';
import { formRegistry } from './forms/registry';
import { registerPlugin } from './forms/plugins/index';
import { submitTypo3Form } from './forms/submit/index';
import { registerDefaultValidators } from './forms/validators';

export { formRegistry } from './forms/registry';
export { registerPlugin } from './forms/plugins/index';
export { ClientVariantsPlugin } from './forms/plugins/client-variants/index';
export { submitTypo3Form } from './forms/submit/index';
export { initField } from './forms/init-field';
export type { FieldPlugin, FieldPluginFactory, FieldPluginHost, FormPlugin, FormPluginFactory, FormPluginHost, ClientVariant, FormSubmitContext, FormSubmitActions, FormSubmitFunction } from './forms/types';

registerPlugin('combobox', () => import('./forms/plugins/combobox'));
registerPlugin('datepicker', () => import('./forms/plugins/datepicker'));
formRegistry.registerFormPlugin(() => import('./forms/plugins/client-variants/client-variants-plugin'));

registerDefaultValidators();

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => formRegistry.init(submitTypo3Form));
} else {
  formRegistry.init(submitTypo3Form);
}

