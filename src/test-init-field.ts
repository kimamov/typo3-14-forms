import { initField } from './forms/init-field';
import ComboboxPlugin from './forms/plugins/combobox';

export function testStandaloneCombobox(): void {
  const container = document.createElement('div');
  container.style.cssText = 'max-width: 400px; padding: 2rem; margin: 2rem auto; font-family: system-ui;';

  container.innerHTML = `
    <h3>Standalone combobox test</h3>
    <div data-form-field="country"
         data-field-type="combobox"
         data-validate='[{"type":"NotEmpty"}]'>
      <label for="country-select">Country</label>
      <select id="country-select" class="form-select">
        <option value="">Choose a country…</option>
        <option value="de">Germany</option>
        <option value="nl">Netherlands</option>
        <option value="fr">France</option>
        <option value="be">Belgium</option>
        <option value="at">Austria</option>
        <option value="ch">Switzerland</option>
      </select>
      <span id="country-select-errors" class="invalid-feedback" role="alert"></span>
    </div>
  `;

  document.body.prepend(container);

  const wrapper = container.querySelector<HTMLElement>('[data-form-field="country"]')!;
  const field = initField(wrapper, ComboboxPlugin);

  field.setChangeCallback((state) => {
    console.log('[test] field state changed:', state);
  });

  // expose for console debugging
  (window as unknown as Record<string, unknown>).__testField = field;
  console.log('[test] Standalone combobox initialized. Access via window.__testField');
}
