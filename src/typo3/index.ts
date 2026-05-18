import { formRegistry } from '../forms/registry';
import { registerPlugin } from '../forms/plugins/index';
import { registerDefaultValidators } from '../forms/validators';
import { createTypo3Submit } from './submit';
import type { Typo3FormsOptions, Typo3FormsApi } from './types';
import type { RegistryEventHandler } from '../forms/types';

export type { Typo3FormsOptions, Typo3FormsHooks, Typo3AjaxFormResponse, Typo3FormsApi } from './types';

let initialized = false;

export function initTypo3Forms(options?: Typo3FormsOptions): Typo3FormsApi {
  if (initialized) {
    console.warn('[Typo3Forms] initTypo3Forms() called more than once — ignoring duplicate call');
    return { registry: formRegistry, destroy() {} };
  }
  initialized = true;

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

  let registeredHandler: RegistryEventHandler | null = null;
  if (options?.hooks?.onFormRegistered) {
    const hook = options.hooks.onFormRegistered;
    registeredHandler = ({ formId }) => {
      const api = formRegistry.get(formId);
      if (api) hook(api);
    };
    formRegistry.on('form:registered', registeredHandler);
  }

  const formSelector = options?.formSelector;
  const controllerOptions = options?.fieldSelector ? { fieldSelector: options.fieldSelector } : undefined;

  const init = () => formRegistry.init(submitFn, document, formSelector, controllerOptions);

  let domListener: (() => void) | null = null;
  if (document.readyState === 'loading') {
    domListener = init;
    document.addEventListener('DOMContentLoaded', domListener);
  } else {
    init();
  }

  return {
    registry: formRegistry,
    destroy() {
      for (const [formId] of formRegistry.getAll()) {
        formRegistry.unregister(formId);
      }
      if (registeredHandler) {
        formRegistry.off('form:registered', registeredHandler);
      }
      if (domListener) {
        document.removeEventListener('DOMContentLoaded', domListener);
      }
      initialized = false;
    },
  };
}
