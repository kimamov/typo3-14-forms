import type { FormPlugin, FormPluginHost, FieldEventHandler, ClientVariant } from '../../types';
import { evaluateExpression } from './expression-parser';

interface FieldVariantConfig {
  fieldName: string;
  variants: ClientVariant[];
}

const DISABLED_FIELDS_INPUT_NAME = '__clientVariantsDisabled';

/**
 * Reactively evaluates client-side variant conditions and enables/disables
 * fields based on other field values. Disabled fields are excluded from
 * both client-side validation and backend validation (via a hidden input
 * listing disabled field names).
 *
 * Configure via data-client-variants attribute on field wrappers:
 *
 *   <div data-form-field="germanTax"
 *        data-client-variants='[{"condition": "formValue(\"country\") === \"germany\"", "enabled": true}]'>
 *
 * When no variant condition matches, the field defaults to disabled. If any
 * variant with enabled:true matches, the field is enabled.
 */
export default class ClientVariantsPlugin implements FormPlugin {
  private host!: FormPluginHost;
  private formEl!: HTMLFormElement;
  private configs: FieldVariantConfig[] = [];
  private disabledInput!: HTMLInputElement;
  private changeHandler!: FieldEventHandler;
  private addedHandler!: FieldEventHandler;

  async init(formEl: HTMLFormElement, host: FormPluginHost): Promise<void> {
    this.host = host;
    this.formEl = formEl;

    this.configs = this.parseConfigs();
    this.disabledInput = this.createDisabledFieldsInput();

    this.changeHandler = () => this.evaluate();
    this.addedHandler = () => {
      this.configs = this.parseConfigs();
      this.evaluate();
    };
    this.host.on('field:change', this.changeHandler);
    this.host.on('field:added', this.addedHandler);

    if (this.configs.length > 0) {
      this.evaluate();
    }
  }

  destroy(): void {
    if (this.changeHandler) {
      this.host.off('field:change', this.changeHandler);
    }
    if (this.addedHandler) {
      this.host.off('field:added', this.addedHandler);
    }
    this.disabledInput?.remove();
  }

  private parseConfigs(): FieldVariantConfig[] {
    const configs: FieldVariantConfig[] = [];
    const wrappers = this.formEl.querySelectorAll<HTMLElement>('[data-client-variants]');

    for (const wrapper of Array.from(wrappers)) {
      const fieldName = wrapper.getAttribute('data-form-field');
      const raw = wrapper.getAttribute('data-client-variants');
      if (!fieldName || !raw) continue;

      try {
        const variants = JSON.parse(raw) as ClientVariant[];
        if (Array.isArray(variants) && variants.length > 0) {
          configs.push({ fieldName, variants });
        }
      } catch {
        console.warn(`[FormsModule] Invalid data-client-variants JSON on field "${fieldName}"`);
      }
    }

    return configs;
  }

  private createDisabledFieldsInput(): HTMLInputElement {
    let input = this.formEl.querySelector<HTMLInputElement>(
      `input[name="${DISABLED_FIELDS_INPUT_NAME}"]`,
    );
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = DISABLED_FIELDS_INPUT_NAME;
      this.formEl.appendChild(input);
    }
    return input;
  }

  private evaluate(): void {
    const disabledFields: string[] = [];

    for (const config of this.configs) {
      const enabled = this.evaluateVariants(config.variants);
      this.host.setFieldEnabled(config.fieldName, enabled);
      if (!enabled) {
        disabledFields.push(config.fieldName);
      }
    }

    this.disabledInput.value = disabledFields.join(',');
  }

  private evaluateVariants(variants: ClientVariant[]): boolean {
    for (const variant of variants) {
      try {
        const matches = evaluateExpression(variant.condition, (fieldName) => {
          return this.host.getFieldValue(fieldName) ?? '';
        });

        if (matches && variant.enabled === true) {
          return true;
        }
      } catch (err) {
        console.warn('[FormsModule] Error evaluating variant condition:', err);
      }
    }

    return false;
  }
}
