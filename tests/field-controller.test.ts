import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FieldController } from '../src/forms/field-controller';
import type { FieldPlugin, FieldPluginHost } from '../src/forms/types';
import { registerDefaultValidators } from '../src/forms/validators';

function createFieldHTML(opts: {
  name: string;
  type?: 'text' | 'email' | 'select' | 'textarea' | 'checkbox';
  value?: string;
  validate?: object[];
  fieldType?: string;
  required?: boolean;
} = { name: 'test' }): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.setAttribute('data-form-field', opts.name);
  if (opts.fieldType) wrapper.setAttribute('data-field-type', opts.fieldType);
  if (opts.validate) wrapper.setAttribute('data-validate', JSON.stringify(opts.validate));

  let inputHTML: string;
  const id = `${opts.name}-input`;

  switch (opts.type) {
    case 'select':
      inputHTML = `
        <select id="${id}">
          <option value="">Choose...</option>
          <option value="a">A</option>
          <option value="b">B</option>
        </select>`;
      break;
    case 'textarea':
      inputHTML = `<textarea id="${id}">${opts.value ?? ''}</textarea>`;
      break;
    case 'checkbox':
      inputHTML = `<input id="${id}" type="checkbox" value="yes" ${opts.value === 'yes' ? 'checked' : ''}>`;
      break;
    default:
      inputHTML = `<input id="${id}" type="${opts.type ?? 'text'}" value="${opts.value ?? ''}" ${opts.required ? 'required' : ''}>`;
  }

  wrapper.innerHTML = `
    <label for="${id}">${opts.name}</label>
    ${inputHTML}
    <span id="${id}-errors" class="invalid-feedback" role="alert"></span>
  `;

  document.body.appendChild(wrapper);
  return wrapper;
}

function cleanup(): void {
  document.body.innerHTML = '';
}

describe('FieldController', () => {
  afterEach(cleanup);
  registerDefaultValidators();

  describe('initialization', () => {
    it('reads the field name from data-form-field', () => {
      const wrapper = createFieldHTML({ name: 'firstName' });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.name).toBe('firstName');
    });

    it('sets initial state correctly', () => {
      const wrapper = createFieldHTML({ name: 'email', value: 'test@test.com' });
      const ctrl = new FieldController(wrapper);
      const state = ctrl.state;

      expect(state.name).toBe('email');
      expect(state.value).toBe('test@test.com');
      expect(state.isValid).toBe(true);
      expect(state.isDirty).toBe(false);
      expect(state.isTouched).toBe(false);
      expect(state.errors).toEqual([]);
    });

    it('throws when no input is found', () => {
      const wrapper = document.createElement('div');
      wrapper.setAttribute('data-form-field', 'empty');
      document.body.appendChild(wrapper);

      expect(() => new FieldController(wrapper)).toThrow('No input found');
    });

    it('exposes element and inputElement', () => {
      const wrapper = createFieldHTML({ name: 'test' });
      const ctrl = new FieldController(wrapper);

      expect(ctrl.element).toBe(wrapper);
      expect(ctrl.inputElement.tagName).toMatch(/INPUT/i);
    });

    it('reads fieldType from data-field-type', () => {
      const wrapper = createFieldHTML({ name: 'date', fieldType: 'datepicker' });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.fieldType).toBe('datepicker');
    });

    it('returns null fieldType when attribute is absent', () => {
      const wrapper = createFieldHTML({ name: 'basic' });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.fieldType).toBeNull();
    });

    it('removes native validation attributes', () => {
      const wrapper = createFieldHTML({ name: 'req', required: true });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.inputElement.hasAttribute('required')).toBe(false);
    });
  });

  describe('validation', () => {
    it('validates NotEmpty rule', () => {
      const wrapper = createFieldHTML({
        name: 'required_field',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);

      const result = ctrl.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('This field is required.');
      expect(ctrl.state.isValid).toBe(false);
    });

    it('validates passing NotEmpty rule', () => {
      const wrapper = createFieldHTML({
        name: 'name',
        value: 'John',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);

      const result = ctrl.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('validates multiple rules', () => {
      const wrapper = createFieldHTML({
        name: 'email',
        value: 'ab',
        validate: [
          { type: 'NotEmpty' },
          { type: 'StringLength', options: { minimum: 5 } },
          { type: 'EmailAddress' },
        ],
      });
      const ctrl = new FieldController(wrapper);
      const result = ctrl.validate();

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(2);
    });

    it('adds is-invalid CSS class on validation failure', () => {
      const wrapper = createFieldHTML({
        name: 'req',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.validate();

      expect(ctrl.inputElement.classList.contains('is-invalid')).toBe(true);
      expect(wrapper.classList.contains('is-invalid')).toBe(true);
    });

    it('removes is-invalid CSS class on validation success', () => {
      const wrapper = createFieldHTML({
        name: 'field',
        value: 'valid',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.validate();

      expect(ctrl.inputElement.classList.contains('is-invalid')).toBe(false);
    });

    it('sets aria-invalid attribute on failure', () => {
      const wrapper = createFieldHTML({
        name: 'field',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.validate();

      expect(ctrl.inputElement.getAttribute('aria-invalid')).toBe('true');
    });

    it('renders error messages into errors element', () => {
      const wrapper = createFieldHTML({
        name: 'field',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.validate();

      const errorsEl = document.getElementById('field-input-errors')!;
      expect(errorsEl.innerHTML).toContain('This field is required.');
    });

    it('skips validation when disabled', () => {
      const wrapper = createFieldHTML({
        name: 'hidden_field',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.setEnabled(false);

      const result = ctrl.validate();
      expect(result.isValid).toBe(true);
    });
  });

  describe('setValue()', () => {
    it('updates the value and triggers validation', () => {
      const wrapper = createFieldHTML({
        name: 'name',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);

      ctrl.setValue('Alice');
      expect(ctrl.state.value).toBe('Alice');
      expect(ctrl.state.isDirty).toBe(true);
      expect(ctrl.state.isTouched).toBe(true);
      expect(ctrl.state.isValid).toBe(true);
    });

    it('calls change callback after setValue', () => {
      const wrapper = createFieldHTML({ name: 'test' });
      const ctrl = new FieldController(wrapper);
      const cb = vi.fn();

      ctrl.setChangeCallback(cb);
      ctrl.setValue('hello');

      expect(cb).toHaveBeenCalledOnce();
      expect(cb.mock.calls[0][0].value).toBe('hello');
    });
  });

  describe('setEnabled()', () => {
    it('hides the wrapper when disabled', () => {
      const wrapper = createFieldHTML({ name: 'toggle' });
      const ctrl = new FieldController(wrapper);

      ctrl.setEnabled(false);
      expect(wrapper.hidden).toBe(true);
      expect(wrapper.getAttribute('aria-hidden')).toBe('true');
      expect(ctrl.inputElement.disabled).toBe(true);
    });

    it('shows the wrapper when re-enabled', () => {
      const wrapper = createFieldHTML({ name: 'toggle' });
      const ctrl = new FieldController(wrapper);

      ctrl.setEnabled(false);
      ctrl.setEnabled(true);

      expect(wrapper.hidden).toBe(false);
      expect(wrapper.hasAttribute('aria-hidden')).toBe(false);
      expect(ctrl.inputElement.disabled).toBe(false);
    });

    it('clears errors when disabled', () => {
      const wrapper = createFieldHTML({
        name: 'conditonal',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.validate();
      expect(ctrl.state.isValid).toBe(false);

      ctrl.setEnabled(false);
      expect(ctrl.state.isValid).toBe(true);
      expect(ctrl.state.errors).toEqual([]);
    });

    it('is idempotent when called with same value', () => {
      const wrapper = createFieldHTML({ name: 'stable' });
      const ctrl = new FieldController(wrapper);
      const cb = vi.fn();
      ctrl.setChangeCallback(cb);

      ctrl.setEnabled(true);
      expect(cb).not.toHaveBeenCalled();
    });
  });

  describe('setServerErrors()', () => {
    it('applies server errors and marks field invalid', () => {
      const wrapper = createFieldHTML({ name: 'email', value: 'taken@test.com' });
      const ctrl = new FieldController(wrapper);

      ctrl.setServerErrors(['This email is already taken.']);
      expect(ctrl.state.isValid).toBe(false);
      expect(ctrl.state.errors).toContain('This email is already taken.');
      expect(ctrl.state.isTouched).toBe(true);
    });

    it('server errors persist until value changes', () => {
      const wrapper = createFieldHTML({
        name: 'email',
        value: 'taken@test.com',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);

      ctrl.setServerErrors(['Already taken']);
      let result = ctrl.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Already taken');

      ctrl.setValue('new@test.com');
      result = ctrl.validate();
      expect(result.isValid).toBe(true);
    });
  });

  describe('reset()', () => {
    it('resets state to initial values', () => {
      const wrapper = createFieldHTML({
        name: 'field',
        value: 'dirty',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      ctrl.setValue('modified');
      ctrl.validate();

      ctrl.reset();
      const state = ctrl.state;
      expect(state.isDirty).toBe(false);
      expect(state.isTouched).toBe(false);
      expect(state.isValid).toBe(true);
      expect(state.errors).toEqual([]);
    });
  });

  describe('destroy()', () => {
    it('cleans up without errors', () => {
      const wrapper = createFieldHTML({ name: 'cleanup' });
      const ctrl = new FieldController(wrapper);
      expect(() => ctrl.destroy()).not.toThrow();
    });

    it('restores native validation attributes', () => {
      const wrapper = createFieldHTML({ name: 'req', required: true });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.inputElement.hasAttribute('required')).toBe(false);

      ctrl.destroy();
      expect(ctrl.inputElement.hasAttribute('required')).toBe(true);
    });
  });

  describe('plugin attachment', () => {
    it('attaches and initializes a plugin', async () => {
      const wrapper = createFieldHTML({ name: 'combo', fieldType: 'combobox' });
      const ctrl = new FieldController(wrapper);

      const initSpy = vi.fn();
      const destroySpy = vi.fn();
      const plugin: FieldPlugin = {
        init: initSpy,
        destroy: destroySpy,
      };

      await ctrl.attachPlugin(plugin);

      expect(initSpy).toHaveBeenCalledOnce();
      expect(initSpy).toHaveBeenCalledWith(wrapper, ctrl);
    });

    it('destroys plugin on controller destroy', async () => {
      const wrapper = createFieldHTML({ name: 'combo' });
      const ctrl = new FieldController(wrapper);

      const destroySpy = vi.fn();
      const plugin: FieldPlugin = {
        init: vi.fn(),
        destroy: destroySpy,
      };

      await ctrl.attachPlugin(plugin);
      ctrl.destroy();

      expect(destroySpy).toHaveBeenCalledOnce();
    });
  });

  describe('DOM event handling', () => {
    it('marks dirty on input event', async () => {
      const wrapper = createFieldHTML({ name: 'typing' });
      const ctrl = new FieldController(wrapper);

      ctrl.inputElement.dispatchEvent(new Event('input', { bubbles: true }));
      expect(ctrl.state.isDirty).toBe(true);
    });

    it('marks touched and validates on blur', () => {
      const wrapper = createFieldHTML({
        name: 'blurring',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);

      ctrl.inputElement.dispatchEvent(new Event('blur'));
      expect(ctrl.state.isTouched).toBe(true);
      expect(ctrl.state.isValid).toBe(false);
    });

    it('validates on change event', () => {
      const wrapper = createFieldHTML({
        name: 'changing',
        value: 'hello',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);

      ctrl.inputElement.dispatchEvent(new Event('change'));
      expect(ctrl.state.isTouched).toBe(true);
      expect(ctrl.state.isDirty).toBe(true);
    });
  });

  describe('select element', () => {
    it('works with select elements', () => {
      const wrapper = createFieldHTML({
        name: 'country',
        type: 'select',
        validate: [{ type: 'NotEmpty' }],
      });
      const ctrl = new FieldController(wrapper);
      const select = ctrl.inputElement as HTMLSelectElement;

      select.value = 'a';
      select.dispatchEvent(new Event('change'));

      expect(ctrl.state.value).toBe('a');
      expect(ctrl.state.isValid).toBe(true);
    });
  });

  describe('checkbox element', () => {
    it('reads checked value for checkbox', () => {
      const wrapper = createFieldHTML({
        name: 'agree',
        type: 'checkbox',
        value: 'yes',
      });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.state.value).toBe('yes');
    });

    it('reads empty for unchecked checkbox', () => {
      const wrapper = createFieldHTML({
        name: 'agree',
        type: 'checkbox',
      });
      const ctrl = new FieldController(wrapper);
      expect(ctrl.state.value).toBe('');
    });
  });

  describe('replaceInput()', () => {
    it('swaps the internal input element', () => {
      const wrapper = createFieldHTML({ name: 'swap' });
      const ctrl = new FieldController(wrapper);
      const originalInput = ctrl.inputElement;

      const newInput = document.createElement('input');
      newInput.type = 'hidden';
      newInput.value = 'swapped';
      wrapper.appendChild(newInput);

      ctrl.replaceInput(newInput);
      expect(ctrl.inputElement).toBe(newInput);
      expect(ctrl.inputElement).not.toBe(originalInput);
    });
  });
});
