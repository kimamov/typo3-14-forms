import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { FormController } from '../src/forms/form-controller';
import type { FormSubmitFunction, FormPlugin, FormPluginHost, FieldEventDetail, FormEventDetail } from '../src/forms/types';
import { registerDefaultValidators } from '../src/forms/validators';

const noopSubmit: FormSubmitFunction = async () => {};

/**
 * Builds a realistic multi-field registration form with various
 * field types, validation rules, and conditional visibility attributes.
 */
function createRegistrationForm(): HTMLFormElement {
  const form = document.createElement('form');
  form.id = 'registration';
  form.action = '/api/register';
  form.method = 'POST';
  form.innerHTML = `
    <!-- Name -->
    <div data-form-field="firstName"
         data-validate='[{"type":"NotEmpty"},{"type":"StringLength","options":{"minimum":2,"maximum":50}}]'>
      <label for="firstName">First Name</label>
      <input id="firstName" type="text" name="firstName">
      <span id="firstName-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <div data-form-field="lastName"
         data-validate='[{"type":"NotEmpty"},{"type":"StringLength","options":{"minimum":2,"maximum":50}}]'>
      <label for="lastName">Last Name</label>
      <input id="lastName" type="text" name="lastName">
      <span id="lastName-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <!-- Email -->
    <div data-form-field="email"
         data-validate='[{"type":"NotEmpty"},{"type":"EmailAddress"}]'>
      <label for="email">Email</label>
      <input id="email" type="email" name="email">
      <span id="email-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <!-- Age -->
    <div data-form-field="age"
         data-validate='[{"type":"NotEmpty"},{"type":"Integer"},{"type":"NumberRange","options":{"minimum":18,"maximum":120}}]'>
      <label for="age">Age</label>
      <input id="age" type="number" name="age">
      <span id="age-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <!-- Country (select) -->
    <div data-form-field="country"
         data-validate='[{"type":"NotEmpty"}]'>
      <label for="country">Country</label>
      <select id="country" name="country">
        <option value="">Choose...</option>
        <option value="de">Germany</option>
        <option value="nl">Netherlands</option>
        <option value="fr">France</option>
        <option value="us">United States</option>
      </select>
      <span id="country-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <!-- Phone (optional, with regex) -->
    <div data-form-field="phone"
         data-validate='[{"type":"RegularExpression","options":{"regularExpression":"/^\\\\+?[0-9\\\\s-]{7,15}$/"}}]'>
      <label for="phone">Phone</label>
      <input id="phone" type="tel" name="phone">
      <span id="phone-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <!-- Message (textarea, optional string length) -->
    <div data-form-field="message"
         data-validate='[{"type":"StringLength","options":{"maximum":500}}]'>
      <label for="message">Message</label>
      <textarea id="message" name="message"></textarea>
      <span id="message-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <!-- Terms checkbox -->
    <div data-form-field="terms"
         data-validate='[{"type":"NotEmpty"}]'>
      <label>
        <input id="terms" type="checkbox" name="terms" value="accepted">
        I accept the terms
      </label>
      <span id="terms-errors" class="invalid-feedback" role="alert"></span>
    </div>

    <button type="submit">Register</button>
  `;

  document.body.appendChild(form);
  return form;
}

function cleanup(): void {
  document.body.innerHTML = '';
}

describe('FormController', () => {
  afterEach(cleanup);
  registerDefaultValidators();

  describe('initialization', () => {
    it('discovers all fields in the form', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const state = ctrl.getState();
      expect(Object.keys(state.fields)).toEqual(
        expect.arrayContaining(['firstName', 'lastName', 'email', 'age', 'country', 'phone', 'message', 'terms']),
      );
      expect(Object.keys(state.fields)).toHaveLength(8);
    });

    it('sets form id from element', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);
      expect(ctrl.id).toBe('registration');
    });

    it('sets novalidate on the form element', () => {
      const form = createRegistrationForm();
      new FormController(form, noopSubmit);
      expect(form.hasAttribute('novalidate')).toBe(true);
    });

    it('initial state is valid (no validation triggered)', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);
      const state = ctrl.getState();

      expect(state.isValid).toBe(true);
      expect(state.isDirty).toBe(false);
      expect(state.isSubmitting).toBe(false);
    });
  });

  describe('getField()', () => {
    it('returns field state by name', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const field = ctrl.getField('email');
      expect(field).toBeDefined();
      expect(field!.name).toBe('email');
    });

    it('returns undefined for non-existent field', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);
      expect(ctrl.getField('nonexistent')).toBeUndefined();
    });
  });

  describe('validate()', () => {
    it('fails validation on empty required fields', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const isValid = await ctrl.validate();
      expect(isValid).toBe(false);

      const state = ctrl.getState();
      expect(state.fields.firstName.isValid).toBe(false);
      expect(state.fields.lastName.isValid).toBe(false);
      expect(state.fields.email.isValid).toBe(false);
      expect(state.fields.age.isValid).toBe(false);
      expect(state.fields.country.isValid).toBe(false);
      expect(state.fields.terms.isValid).toBe(false);
    });

    it('optional fields pass when empty', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      await ctrl.validate();
      const state = ctrl.getState();
      expect(state.fields.phone.isValid).toBe(true);
      expect(state.fields.message.isValid).toBe(true);
    });

    it('passes when all required fields are filled correctly', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'john@example.com';
      (document.getElementById('age') as HTMLInputElement).value = '30';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      const isValid = await ctrl.validate();
      expect(isValid).toBe(true);
    });

    it('fails with invalid email format', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'not-an-email';
      (document.getElementById('age') as HTMLInputElement).value = '30';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      const isValid = await ctrl.validate();
      expect(isValid).toBe(false);
      expect(ctrl.getField('email')!.errors).toContain('Please enter a valid email address.');
    });

    it('fails with age out of range', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'john@example.com';
      (document.getElementById('age') as HTMLInputElement).value = '15';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      const isValid = await ctrl.validate();
      expect(isValid).toBe(false);
      expect(ctrl.getField('age')!.errors.some((e) => e.includes('at least 18'))).toBe(true);
    });

    it('fails with name too short', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'J';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'j@example.com';
      (document.getElementById('age') as HTMLInputElement).value = '25';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      const isValid = await ctrl.validate();
      expect(isValid).toBe(false);
      expect(ctrl.getField('firstName')!.errors.some((e) => e.includes('at least 2'))).toBe(true);
    });

    it('fails with message too long', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'j@test.com';
      (document.getElementById('age') as HTMLInputElement).value = '25';
      (document.getElementById('country') as HTMLSelectElement).value = 'nl';
      (document.getElementById('terms') as HTMLInputElement).checked = true;
      (document.getElementById('message') as HTMLTextAreaElement).value = 'x'.repeat(501);

      const isValid = await ctrl.validate();
      expect(isValid).toBe(false);
      expect(ctrl.getField('message')!.errors.some((e) => e.includes('at most 500'))).toBe(true);
    });

    it('focuses first invalid field', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const firstInput = document.getElementById('firstName') as HTMLInputElement;
      const focusSpy = vi.spyOn(firstInput, 'focus');

      await ctrl.validate();
      expect(focusSpy).toHaveBeenCalled();
    });
  });

  describe('events', () => {
    it('emits form:valid on successful validation', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'j@test.com';
      (document.getElementById('age') as HTMLInputElement).value = '25';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      const handler = vi.fn();
      ctrl.on('form:valid', handler);

      await ctrl.validate();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('emits form:invalid on failed validation', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('form:invalid', handler);

      await ctrl.validate();
      expect(handler).toHaveBeenCalledOnce();
    });

    it('emits field:change on individual field changes', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('field:change', handler);

      const input = document.getElementById('firstName') as HTMLInputElement;
      input.value = 'Jane';
      input.dispatchEvent(new Event('change'));

      expect(handler).toHaveBeenCalled();
      const detail = handler.mock.calls[0][0] as FieldEventDetail;
      expect(detail.fieldName).toBe('firstName');
      expect(detail.formId).toBe('registration');
    });

    it('emits field:valid / field:invalid events', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const validHandler = vi.fn();
      const invalidHandler = vi.fn();
      ctrl.on('field:valid', validHandler);
      ctrl.on('field:invalid', invalidHandler);

      const input = document.getElementById('email') as HTMLInputElement;
      input.dispatchEvent(new Event('blur'));

      expect(invalidHandler).toHaveBeenCalled();
    });

    it('emits form:reset event', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('form:reset', handler);
      ctrl.reset();

      expect(handler).toHaveBeenCalledOnce();
    });

    it('removes event handler with off()', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('form:invalid', handler);
      ctrl.off('form:invalid', handler);

      await ctrl.validate();
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('reset()', () => {
    it('resets all fields to initial state', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('firstName') as HTMLInputElement).dispatchEvent(new Event('change'));
      await ctrl.validate();

      ctrl.reset();
      const state = ctrl.getState();

      for (const field of Object.values(state.fields)) {
        expect(field.isDirty).toBe(false);
        expect(field.isTouched).toBe(false);
        expect(field.isValid).toBe(true);
        expect(field.errors).toEqual([]);
      }
    });
  });

  describe('setFieldEnabled()', () => {
    it('disables and hides a field', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      ctrl.setFieldEnabled('phone', false);
      const phoneWrapper = form.querySelector('[data-form-field="phone"]') as HTMLElement;
      expect(phoneWrapper.hidden).toBe(true);
    });

    it('disabled fields are excluded from validity check', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'j@test.com';
      (document.getElementById('age') as HTMLInputElement).value = '25';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      const isValid = await ctrl.validate();
      expect(isValid).toBe(true);
    });
  });

  describe('dynamic field discovery (MutationObserver)', () => {
    it('emits field:added when new field is appended', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('field:added', handler);

      const newField = document.createElement('div');
      newField.setAttribute('data-form-field', 'website');
      newField.innerHTML = `
        <label for="website">Website</label>
        <input id="website" type="url" name="website">
        <span id="website-errors" class="invalid-feedback"></span>
      `;
      form.appendChild(newField);

      // MutationObserver is async — wait for microtask
      await new Promise((r) => setTimeout(r, 0));

      expect(handler).toHaveBeenCalled();
      const detail = handler.mock.calls[0][0] as FieldEventDetail;
      expect(detail.fieldName).toBe('website');
    });

    it('emits field:removed when a field is removed', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('field:removed', handler);

      const phoneField = form.querySelector('[data-form-field="phone"]')!;
      phoneField.remove();

      await new Promise((r) => setTimeout(r, 0));

      expect(handler).toHaveBeenCalled();
      const detail = handler.mock.calls[0][0] as FieldEventDetail;
      expect(detail.fieldName).toBe('phone');
    });
  });

  describe('destroy()', () => {
    it('cleans up without errors', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);
      expect(() => ctrl.destroy()).not.toThrow();
    });

    it('clears all fields after destroy', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);
      ctrl.destroy();

      const state = ctrl.getState();
      expect(Object.keys(state.fields)).toHaveLength(0);
    });
  });

  describe('form plugin attachment', () => {
    it('initializes a form plugin', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const initSpy = vi.fn();
      const plugin: FormPlugin = {
        init: initSpy,
        destroy: vi.fn(),
      };

      await ctrl.attachFormPlugin(plugin);

      expect(initSpy).toHaveBeenCalledOnce();
      expect(initSpy).toHaveBeenCalledWith(form, ctrl);
    });

    it('plugin receives FormPluginHost interface', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      let host: FormPluginHost | null = null;
      const plugin: FormPlugin = {
        init: (_el, h) => { host = h; },
        destroy: vi.fn(),
      };

      await ctrl.attachFormPlugin(plugin);

      expect(host).not.toBeNull();
      expect(host!.id).toBe('registration');
      expect(host!.getFieldNames()).toHaveLength(8);
      expect(host!.getFieldValue('email')).toBe('');
    });

    it('plugin can read and set field state', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      let host: FormPluginHost | null = null;
      const plugin: FormPlugin = {
        init: (_el, h) => { host = h; },
        destroy: vi.fn(),
      };

      await ctrl.attachFormPlugin(plugin);

      host!.setFieldEnabled('phone', false);
      const phoneField = ctrl.getField('phone');
      expect(phoneField!.isValid).toBe(true);
    });

    it('destroys plugins on controller destroy', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const destroySpy = vi.fn();
      const plugin: FormPlugin = {
        init: vi.fn(),
        destroy: destroySpy,
      };

      await ctrl.attachFormPlugin(plugin);
      ctrl.destroy();

      expect(destroySpy).toHaveBeenCalledOnce();
    });
  });

  describe('submit handling', () => {
    it('calls submit function with form data when valid', async () => {
      const form = createRegistrationForm();
      const submitFn = vi.fn<FormSubmitFunction>(async () => {});
      const ctrl = new FormController(form, submitFn);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'j@test.com';
      (document.getElementById('age') as HTMLInputElement).value = '25';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));

      // wait for async submit handler
      await new Promise((r) => setTimeout(r, 10));

      expect(submitFn).toHaveBeenCalledOnce();
      const ctx = submitFn.mock.calls[0][0];
      expect(ctx.formEl).toBe(form);
      expect(ctx.formData).toBeInstanceOf(FormData);
    });

    it('does not call submit function when invalid', async () => {
      const form = createRegistrationForm();
      const submitFn = vi.fn<FormSubmitFunction>(async () => {});
      const ctrl = new FormController(form, submitFn);

      form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
      await new Promise((r) => setTimeout(r, 10));

      expect(submitFn).not.toHaveBeenCalled();
    });

    it('emits form:submit event on submit', async () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const handler = vi.fn();
      ctrl.on('form:submit', handler);

      form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
      await new Promise((r) => setTimeout(r, 10));

      expect(handler).toHaveBeenCalledOnce();
    });
  });

  describe('server error application', () => {
    it('applies server validation errors to specific fields', async () => {
      const form = createRegistrationForm();
      const submitFn: FormSubmitFunction = async (ctx) => {
        ctx.applyValidationErrors({
          email: ['This email is already registered.'],
          firstName: ['Name contains invalid characters.'],
        });
      };
      const ctrl = new FormController(form, submitFn);

      (document.getElementById('firstName') as HTMLInputElement).value = 'John!';
      (document.getElementById('lastName') as HTMLInputElement).value = 'Doe';
      (document.getElementById('email') as HTMLInputElement).value = 'taken@test.com';
      (document.getElementById('age') as HTMLInputElement).value = '25';
      (document.getElementById('country') as HTMLSelectElement).value = 'de';
      (document.getElementById('terms') as HTMLInputElement).checked = true;

      form.dispatchEvent(new SubmitEvent('submit', { cancelable: true }));
      await new Promise((r) => setTimeout(r, 10));

      const emailState = ctrl.getField('email');
      expect(emailState!.isValid).toBe(false);
      expect(emailState!.errors).toContain('This email is already registered.');

      const nameState = ctrl.getField('firstName');
      expect(nameState!.isValid).toBe(false);
      expect(nameState!.errors).toContain('Name contains invalid characters.');
    });
  });

  describe('isDirty computation', () => {
    it('is not dirty initially', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);
      expect(ctrl.getState().isDirty).toBe(false);
    });

    it('becomes dirty when any field changes', () => {
      const form = createRegistrationForm();
      const ctrl = new FormController(form, noopSubmit);

      const input = document.getElementById('firstName') as HTMLInputElement;
      input.value = 'Jane';
      input.dispatchEvent(new Event('change'));

      expect(ctrl.getState().isDirty).toBe(true);
    });
  });
});
