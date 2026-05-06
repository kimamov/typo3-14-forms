import { describe, it, expect, vi, afterEach } from 'vitest';
import { FormRegistry } from '../src/forms/registry';
import type { FormSubmitFunction } from '../src/forms/types';

const noopSubmit: FormSubmitFunction = async () => {};

function createForm(id: string): HTMLFormElement {
  const form = document.createElement('form');
  form.id = id;
  form.action = '/submit';
  form.innerHTML = `
    <div data-form-field="name" data-validate='[{"type":"NotEmpty"}]'>
      <label for="${id}-name">Name</label>
      <input id="${id}-name" type="text" name="name">
      <span id="${id}-name-errors" class="invalid-feedback"></span>
    </div>
    <div data-form-field="email" data-validate='[{"type":"NotEmpty"},{"type":"EmailAddress"}]'>
      <label for="${id}-email">Email</label>
      <input id="${id}-email" type="email" name="email">
      <span id="${id}-email-errors" class="invalid-feedback"></span>
    </div>
    <button type="submit">Submit</button>
  `;
  document.body.appendChild(form);
  return form;
}

function cleanup(): void {
  document.body.innerHTML = '';
}

describe('FormRegistry', () => {
  afterEach(cleanup);

  it('registers a form and returns a controller', () => {
    const registry = new FormRegistry();
    const form = createForm('contact');

    const ctrl = registry.register(form, noopSubmit);
    expect(ctrl).toBeDefined();
    expect(ctrl.id).toBe('contact');
  });

  it('can retrieve a registered form by id', () => {
    const registry = new FormRegistry();
    const form = createForm('contact');
    registry.register(form, noopSubmit);

    const retrieved = registry.get('contact');
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('contact');
  });

  it('returns undefined for unregistered form', () => {
    const registry = new FormRegistry();
    expect(registry.get('nonexistent')).toBeUndefined();
  });

  it('does not re-register the same form', () => {
    const registry = new FormRegistry();
    const form = createForm('contact');

    const ctrl1 = registry.register(form, noopSubmit);
    const ctrl2 = registry.register(form, noopSubmit);
    expect(ctrl1).toBe(ctrl2);
  });

  it('getAll() returns all registered forms', () => {
    const registry = new FormRegistry();
    createForm('form1');
    createForm('form2');

    registry.init(noopSubmit);
    const all = registry.getAll();
    expect(all.size).toBe(2);
    expect(all.has('form1')).toBe(true);
    expect(all.has('form2')).toBe(true);
  });

  it('init() discovers forms with id attribute', () => {
    const registry = new FormRegistry();
    createForm('auto1');
    createForm('auto2');

    // form without id should be skipped
    const noIdForm = document.createElement('form');
    noIdForm.innerHTML = '<div data-form-field="x"><input type="text"></div>';
    document.body.appendChild(noIdForm);

    registry.init(noopSubmit);
    expect(registry.getAll().size).toBe(2);
  });

  it('unregister() removes a form and calls destroy', () => {
    const registry = new FormRegistry();
    const form = createForm('contact');
    const ctrl = registry.register(form, noopSubmit);

    registry.unregister('contact');
    expect(registry.get('contact')).toBeUndefined();
  });

  it('unregister() is a no-op for unknown form', () => {
    const registry = new FormRegistry();
    expect(() => registry.unregister('ghost')).not.toThrow();
  });

  describe('events', () => {
    it('emits form:registered on register', () => {
      const registry = new FormRegistry();
      const handler = vi.fn();

      registry.on('form:registered', handler);
      const form = createForm('contact');
      registry.register(form, noopSubmit);

      expect(handler).toHaveBeenCalledWith({ formId: 'contact' });
    });

    it('emits form:unregistered on unregister', () => {
      const registry = new FormRegistry();
      const handler = vi.fn();
      const form = createForm('contact');

      registry.register(form, noopSubmit);
      registry.on('form:unregistered', handler);
      registry.unregister('contact');

      expect(handler).toHaveBeenCalledWith({ formId: 'contact' });
    });

    it('removes event handler with off()', () => {
      const registry = new FormRegistry();
      const handler = vi.fn();

      registry.on('form:registered', handler);
      registry.off('form:registered', handler);

      const form = createForm('contact');
      registry.register(form, noopSubmit);

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('init() with custom root', () => {
    it('scopes discovery to a container element', () => {
      const registry = new FormRegistry();

      const container = document.createElement('div');
      const form = document.createElement('form');
      form.id = 'scoped';
      form.innerHTML = `
        <div data-form-field="x">
          <input type="text">
        </div>
      `;
      container.appendChild(form);
      document.body.appendChild(container);

      // another form outside the container
      createForm('outside');

      registry.init(noopSubmit, container);
      expect(registry.getAll().size).toBe(1);
      expect(registry.get('scoped')).toBeDefined();
    });
  });
});
