import type {
  FormState,
  FormEventType,
  FormEventHandler,
  FieldEventDetail,
  FormEventDetail,
  FormControllerApi,
  FormPluginHost,
  FormPlugin,
  FieldState,
  FormSubmitFunction,
} from './types';
import { SELECTORS } from './types';
import { FieldController } from './field-controller';
import { EventBus } from './events';
import { getPluginFactory } from './plugins/index';

export class FormController implements FormControllerApi, FormPluginHost {
  readonly id: string;
  private readonly formEl: HTMLFormElement;
  private readonly fields = new Map<string, FieldController>();
  private readonly formPlugins: FormPlugin[] = [];
  private readonly eventBus = new EventBus();
  private readonly observer: MutationObserver;
  private readonly abortController = new AbortController();
  private readonly submitFn: FormSubmitFunction;

  private _isSubmitting = false;
  private _allowSubmit = false;

  constructor(formEl: HTMLFormElement, submitFn: FormSubmitFunction) {
    this.formEl = formEl;
    this.id = formEl.id;
    this.submitFn = submitFn;

    this.formEl.setAttribute('novalidate', '');

    this.discoverFields();
    this.observer = this.createObserver();
    this.bindSubmit();
  }

  getField(name: string): FieldState | undefined {
    return this.fields.get(name)?.state;
  }

  getState(): FormState {
    const fields: Record<string, FieldState> = {};
    for (const [name, ctrl] of this.fields) {
      fields[name] = ctrl.state;
    }

    return {
      id: this.id,
      isValid: this.computeIsValid(),
      isSubmitting: this._isSubmitting,
      isDirty: this.computeIsDirty(),
      fields,
    };
  }

  async validate(): Promise<boolean> {
    let firstInvalid: FieldController | null = null;

    for (const ctrl of this.fields.values()) {
      const result = ctrl.validate();
      if (!result.isValid && !firstInvalid) {
        firstInvalid = ctrl;
      }
    }

    const isValid = this.computeIsValid();
    const detail: FormEventDetail = { formId: this.id, state: this.getState() };
    this.eventBus.emit(isValid ? 'form:valid' : 'form:invalid', detail);

    if (firstInvalid) {
      firstInvalid.inputElement.focus();
    }

    return isValid;
  }

  reset(): void {
    for (const ctrl of this.fields.values()) {
      ctrl.reset();
    }
    this.eventBus.emit('form:reset', { formId: this.id, state: this.getState() });
  }

  destroy(): void {
    this.abortController.abort();
    this.observer.disconnect();
    for (const plugin of this.formPlugins) {
      plugin.destroy();
    }
    this.formPlugins.length = 0;
    for (const ctrl of this.fields.values()) {
      ctrl.destroy();
    }
    this.fields.clear();
    this.eventBus.destroy();
  }

  on(event: FormEventType, handler: FormEventHandler): void {
    this.eventBus.on(event, handler);
  }

  off(event: FormEventType, handler: FormEventHandler): void {
    this.eventBus.off(event, handler);
  }

  async attachFormPlugin(plugin: FormPlugin): Promise<void> {
    this.formPlugins.push(plugin);
    await plugin.init(this.formEl, this);
  }

  getFieldValue(name: string): string | undefined {
    return this.fields.get(name)?.state.value;
  }

  getFieldNames(): string[] {
    return [...this.fields.keys()];
  }

  setFieldEnabled(name: string, enabled: boolean): void {
    const ctrl = this.fields.get(name);
    if (ctrl) ctrl.setEnabled(enabled);
  }

  private discoverFields(): void {
    const wrappers = this.formEl.querySelectorAll<HTMLElement>(SELECTORS.formField);
    wrappers.forEach((wrapper) => this.initField(wrapper));
  }

  private initField(wrapper: HTMLElement): void {
    const name = wrapper.getAttribute('data-form-field');
    if (!name || this.fields.has(name)) return;

    try {
      const ctrl = new FieldController(wrapper);
      ctrl.setChangeCallback((state) => this.handleFieldChange(state));
      this.fields.set(name, ctrl);

      this.loadPluginIfNeeded(ctrl);

      const detail: FieldEventDetail = {
        formId: this.id,
        fieldName: name,
        state: ctrl.state,
      };
      this.eventBus.emit('field:added', detail);
    } catch (err) {
      console.warn(`[FormsModule] Could not init field "${name}":`, err);
    }
  }

  private loadPluginIfNeeded(ctrl: FieldController): void {
    const type = ctrl.fieldType;
    if (!type) return;

    const factory = getPluginFactory(type);
    if (!factory) return;

    factory()
      .then(({ default: PluginClass }) => {
        const plugin = new PluginClass();
        return ctrl.attachPlugin(plugin);
      })
      .catch((err) => {
        console.warn(`[FormsModule] Failed to load plugin "${type}":`, err);
      });
  }

  private destroyField(wrapper: HTMLElement): void {
    const name = wrapper.getAttribute('data-form-field');
    if (!name) return;

    const ctrl = this.fields.get(name);
    if (!ctrl) return;

    const detail: FieldEventDetail = {
      formId: this.id,
      fieldName: name,
      state: ctrl.state,
    };

    ctrl.destroy();
    this.fields.delete(name);
    this.eventBus.emit('field:removed', detail);
  }

  private handleFieldChange(state: FieldState): void {
    const eventType: FormEventType = state.isValid ? 'field:valid' : 'field:invalid';
    const detail: FieldEventDetail = {
      formId: this.id,
      fieldName: state.name,
      state,
    };
    this.eventBus.emit('field:change', detail);
    this.eventBus.emit(eventType, detail);
  }

  private createObserver(): MutationObserver {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        const added = Array.from(mutation.addedNodes);
        for (const node of added) {
          if (!(node instanceof HTMLElement)) continue;
          const targets = node.matches(SELECTORS.formField)
            ? [node]
            : Array.from(node.querySelectorAll<HTMLElement>(SELECTORS.formField));
          targets.forEach((el) => this.initField(el));
        }
        const removed = Array.from(mutation.removedNodes);
        for (const node of removed) {
          if (!(node instanceof HTMLElement)) continue;
          const targets = node.matches(SELECTORS.formField)
            ? [node]
            : Array.from(node.querySelectorAll<HTMLElement>(SELECTORS.formField));
          targets.forEach((el) => this.destroyField(el));
        }
      }
    });

    observer.observe(this.formEl, { childList: true, subtree: true });
    return observer;
  }

  private bindSubmit(): void {
    const signal = this.abortController.signal;

    this.formEl.addEventListener(
      'submit',
      async (e) => {
        //@TODO: maybe the submit function should decide if we can submit in the future
        if (this._allowSubmit) {
          this._allowSubmit = false;
          return;
        }

        e.preventDefault();
        this._isSubmitting = true;
        this.eventBus.emit('form:submit', { formId: this.id, state: this.getState() });

        const isValid = await this.validate();

        if (isValid) {
          const submitter = (e as SubmitEvent).submitter;
          const formData = new FormData(this.formEl, submitter as HTMLButtonElement);
          await this.submitFn({
            formEl: this.formEl,
            formData,
            submitter,
            signal: this.abortController.signal,
            fallbackToNative: () => {
              this._allowSubmit = true;
              this.formEl.requestSubmit();
            },
            applyValidationErrors: (errors) => {
              this.applyServerErrors(errors);
            },
            nextStep: (state) => {
              this.updateStateHiddenField(state);
              this.eventBus.emit('form:valid', { formId: this.id, state: this.getState() });
            },
            redirect: (url) => {
              window.location.href = url;
            },
            finish: (html) => {
              this.destroy();
              if (html) {
                this.formEl.outerHTML = html;
              }
            },
          });
        }

        this._isSubmitting = false;
      },
      { signal },
    );
  }

  private applyServerErrors(errors: Record<string, string[]>): void {
    for (const [fieldName, messages] of Object.entries(errors)) {
      const ctrl = this.fields.get(fieldName);
      if (ctrl) {
        ctrl.setServerErrors(messages);
      }
    }

    const firstInvalidField = [...this.fields.values()].find((c) => !c.state.isValid);
    if (firstInvalidField) {
      firstInvalidField.inputElement.focus();
    }

    const detail: FormEventDetail = { formId: this.id, state: this.getState() };
    this.eventBus.emit('form:invalid', detail);
  }

  private updateStateHiddenField(state: string): void {
    if (!state) return;
    const stateInput = this.formEl.querySelector<HTMLInputElement>('input[name$="[__state]"]');
    if (stateInput) {
      stateInput.value = state;
    }
  }

  private computeIsValid(): boolean {
    for (const ctrl of this.fields.values()) {
      if (!ctrl.state.isValid) return false;
    }
    return true;
  }

  private computeIsDirty(): boolean {
    for (const ctrl of this.fields.values()) {
      if (ctrl.state.isDirty) return true;
    }
    return false;
  }
}
