import type { FormControllerApi, RegistryEventType, RegistryEventHandler, FieldPluginFactory, FormPluginFactory, FormSubmitFunction } from './types';
import { FormController } from './form-controller';
import { EventBus } from './events';
import { registerValidator } from './validators/index';
import { registerPlugin } from './plugins/index';
import type { Validator } from './types';

export class FormRegistry {
  private readonly forms = new Map<string, FormController>();
  private readonly formPluginFactories: FormPluginFactory[] = [];
  private readonly eventBus = new EventBus();

  init(submitFn: FormSubmitFunction, root: ParentNode = document): void {
    const formElements = root.querySelectorAll<HTMLFormElement>('form[id]');
    formElements.forEach((formEl) => this.register(formEl, submitFn));
  }

  register(formEl: HTMLFormElement, submitFn: FormSubmitFunction): FormControllerApi {
    if (this.forms.has(formEl.id)) {
      return this.forms.get(formEl.id)!;
    }

    const controller = new FormController(formEl, submitFn);
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

  registerFormPlugin(factory: FormPluginFactory): void {
    this.formPluginFactories.push(factory);
  }
}

declare global {
  interface Window {
    __FormsModule: FormRegistry;
  }
}

export const formRegistry = new FormRegistry();
window.__FormsModule = formRegistry;
