import type { FormControllerApi, RegistryEventType, RegistryEventHandler, FieldPluginFactory, FormPluginFactory, FormSubmitFunction } from './types';
import { FormController } from './form-controller';
import type { FormControllerOptions } from './form-controller';
import { EventBus } from './events';
import { registerValidator } from './validators/index';
import { registerPlugin, unregisterPlugin, hasPlugin } from './plugins/index';
import type { Validator } from './types';

export class FormRegistry {
  private readonly forms = new Map<string, FormController>();
  private readonly formPluginFactories: FormPluginFactory[] = [];
  private readonly eventBus = new EventBus();
  private _initialized = false;

  init(submitFn: FormSubmitFunction, root: ParentNode = document, formSelector = 'form[id]', controllerOptions?: FormControllerOptions): void {
    this._initialized = true;
    const formElements = root.querySelectorAll<HTMLFormElement>(formSelector);
    formElements.forEach((formEl) => this.register(formEl, submitFn, controllerOptions));
  }

  register(formEl: HTMLFormElement, submitFn: FormSubmitFunction, controllerOptions?: FormControllerOptions): FormControllerApi {
    if (this.forms.has(formEl.id)) {
      return this.forms.get(formEl.id)!;
    }

    const controller = new FormController(formEl, submitFn, controllerOptions);
    this.forms.set(formEl.id, controller);
    this.loadFormPlugins(controller);
    this.eventBus.emit('form:registered', { formId: formEl.id });
    return controller;
  }

  private loadFormPlugins(controller: FormController): void {
    for (const factory of this.formPluginFactories) {
      factory()
        .then(({ default: PluginClass }) => {
          const plugin = new PluginClass();
          return controller.attachFormPlugin(plugin);
        })
        .catch((err) => {
          console.warn('[FormsModule] Failed to load form plugin:', err);
        });
    }
  }

  unregister(formId: string): void {
    const controller = this.forms.get(formId);
    if (!controller) return;

    controller.destroy();
    this.forms.delete(formId);
    this.eventBus.emit('form:unregistered', { formId });
  }

  get(formId: string): FormControllerApi | undefined {
    return this.forms.get(formId);
  }

  getAll(): Map<string, FormControllerApi> {
    return new Map(this.forms);
  }

  on(event: RegistryEventType, handler: RegistryEventHandler): void {
    this.eventBus.on(event, handler);
  }

  off(event: RegistryEventType, handler: RegistryEventHandler): void {
    this.eventBus.off(event, handler);
  }

  registerValidator(validator: Validator): void {
    registerValidator(validator);
  }

  registerPlugin(type: string, factory: FieldPluginFactory): void {
    registerPlugin(type, factory);
  }

  unregisterPlugin(type: string): boolean {
    return unregisterPlugin(type);
  }

  hasPlugin(type: string): boolean {
    return hasPlugin(type);
  }

  registerFormPlugin(factory: FormPluginFactory): void {
    if (this._initialized) {
      console.warn('[FormsModule] registerFormPlugin called after init — new plugin will only apply to forms registered after this point');
    }
    this.formPluginFactories.push(factory);
  }
}

declare global {
  interface Window {
    __FormsModule?: FormRegistry;
  }
}

export const formRegistry = new FormRegistry();
if (typeof window !== 'undefined') {
  window.__FormsModule = formRegistry;
}
