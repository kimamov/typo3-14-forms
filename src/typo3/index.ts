import { formRegistry } from '../forms/registry';
import { registerPlugin } from '../forms/plugins/index';
import { registerDefaultValidators } from '../forms/validators';
import { createTypo3Submit } from './submit';
import type { Typo3FormsOptions, Typo3FormsApi } from './types';

export type { Typo3FormsOptions, Typo3FormsHooks, Typo3AjaxFormResponse, Typo3FormsApi } from './types';

export function initTypo3Forms(options?: Typo3FormsOptions): Typo3FormsApi {
  if (!options?.disableDefaultValidators) {
    registerDefaultValidators();
  }

  for (const v of options?.additionalValidators ?? []) {
    formRegistry.registerValidator(v);
  }

  registerPlugin('combobox', () => import('../forms/plugins/combobox'));
  registerPlugin('datepicker', () => import('../forms/plugins/datepicker'));
  formRegistry.registerFormPlugin(() => import('../forms/plugins/client-variants/client-variants-plugin'));

  for (const [type, factory] of Object.entries(options?.additionalFieldPlugins ?? {})) {
    registerPlugin(type, factory);
  }

  for (const factory of options?.additionalFormPlugins ?? []) {
    formRegistry.registerFormPlugin(factory);
  }

  const submitFn = options?.onSubmit ?? createTypo3Submit(options?.hooks);

  if (options?.hooks?.onFormRegistered) {
    const hook = options.hooks.onFormRegistered;
    formRegistry.on('form:registered', ({ formId }) => {
      const api = formRegistry.get(formId);
      if (api) hook(api);
    });
  }

  const formSelector = options?.formSelector;
  const controllerOptions = options?.fieldSelector ? { fieldSelector: options.fieldSelector } : undefined;

  const init = () => formRegistry.init(submitFn, document, formSelector, controllerOptions);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  return {
    registry: formRegistry,
    destroy() {
      for (const [formId] of formRegistry.getAll()) {
        formRegistry.unregister(formId);
      }
    },
  };
}
