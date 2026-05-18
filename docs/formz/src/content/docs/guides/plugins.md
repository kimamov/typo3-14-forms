---
title: Plugins
description: Built-in field plugins and how to create custom ones.
---

Plugins enhance individual fields or entire forms. Field plugins transform the DOM (e.g., replacing a `<select>` with a searchable combobox), while form plugins operate on the form as a whole (e.g., conditional field visibility).

## Field Plugins

A field plugin is activated by the `data-field-type` attribute on the field wrapper. Formz lazy-loads the matching plugin from the registry.

### Combobox

Replaces a `<select>` with an accessible, searchable combobox (ARIA 1.2 pattern). The original `<select>` stays hidden and in sync for form submission.

```html
<div data-form-field="country" data-field-type="combobox"
     data-validate='[{"type":"NotEmpty","options":{"message":"Please select a country"}}]'>
  <label for="country">Country</label>
  <select id="country" name="country">
    <option value="">Select...</option>
    <option value="de">Germany</option>
    <option value="at">Austria</option>
    <option value="ch">Switzerland</option>
    <option value="fr">France</option>
    <option value="nl">Netherlands</option>
  </select>
  <div id="country-errors" class="invalid-feedback"></div>
</div>
```

The combobox supports:

- Type-ahead filtering
- Keyboard navigation (arrow keys, Enter, Escape, Home, End)
- ARIA labels and live regions
- Blur commit (selects closest match or reverts)

### Datepicker

Wraps an input with the Air Datepicker library. Reads the date format from a hidden input (TYPO3 convention).

```html
<div data-form-field="startDate" data-field-type="datepicker"
     data-validate='[{"type":"DateTime","options":{"message":"Enter a valid date"}}]'>
  <label for="startDate">Start Date</label>
  <div data-field-type="datepicker">
    <input id="startDate" type="text" name="startDate" />
    <input type="hidden" name="startDate[dateFormat]" value="d.m.Y" />
  </div>
  <div id="startDate-errors" class="invalid-feedback"></div>
</div>
```

## Form Plugins

Form plugins operate on the entire form. They receive the `FormPluginHost` API for reading field values, toggling field visibility, and subscribing to events.

### Client Variants

The built-in `ClientVariantsPlugin` enables/disables fields based on conditions evaluated against other field values — replicating TYPO3's server-side variant logic on the client.

```html
<form id="registration">
  <div data-form-field="accountType" data-validate='[{"type":"NotEmpty"}]'>
    <label for="accountType">Account Type</label>
    <select id="accountType" name="accountType">
      <option value="">Select...</option>
      <option value="personal">Personal</option>
      <option value="business">Business</option>
    </select>
  </div>

  <div data-form-field="companyName"
       data-client-variants='[{"condition": "formValue(\"accountType\") === \"business\"", "enabled": true}]'
       data-validate='[{"type":"NotEmpty","options":{"message":"Company name is required"}}]'>
    <label for="companyName">Company Name</label>
    <input id="companyName" name="companyName" />
    <div id="companyName-errors" class="invalid-feedback"></div>
  </div>

  <div data-form-field="taxId"
       data-client-variants='[{"condition": "formValue(\"accountType\") === \"business\"", "enabled": true}]'
       data-validate='[{"type":"NotEmpty","options":{"message":"Tax ID is required for business accounts"}}]'>
    <label for="taxId">Tax ID</label>
    <input id="taxId" name="taxId" />
    <div id="taxId-errors" class="invalid-feedback"></div>
  </div>

  <button type="submit">Register</button>
</form>
```

When `accountType` is not `"business"`, the `companyName` and `taxId` fields are hidden, disabled, and excluded from validation. A hidden input `__clientVariantsDisabled` lists the disabled field names for the backend.

**Expression syntax** supports `formValue("fieldName")`, comparisons (`===`, `!==`, `>`, `<`, `>=`, `<=`), logical operators (`&&`, `||`, `!`), `in` operator, and string/number/boolean literals.

## Registering Plugins

Plugins are registered globally before form initialization:

```typescript
import { registerPlugin, formRegistry } from 'formz';

// Field plugin (lazy-loaded via dynamic import)
registerPlugin('combobox', () => import('./plugins/combobox'));
registerPlugin('my-slider', () => import('./plugins/slider'));

// Form plugin
formRegistry.registerFormPlugin(() => import('./plugins/my-form-plugin'));
```

With TYPO3, combobox/datepicker/client-variants are registered automatically. Add extras via options:

```typescript
import { initTypo3Forms } from 'formz';

initTypo3Forms({
  additionalFieldPlugins: {
    'color-picker': () => import('./plugins/color-picker'),
    'rich-text': () => import('./plugins/rich-text'),
  },
  additionalFormPlugins: [
    () => import('./plugins/analytics'),
  ],
});
```

## Creating a Custom Field Plugin

A field plugin implements the `FieldPlugin` interface:

```typescript
import type { FieldPlugin, FieldPluginHost } from 'formz';

export default class TogglePlugin implements FieldPlugin {
  private host!: FieldPluginHost;
  private toggle!: HTMLButtonElement;

  async init(wrapper: HTMLElement, host: FieldPluginHost): Promise<void> {
    this.host = host;
    const input = host.inputElement as HTMLInputElement;

    this.toggle = document.createElement('button');
    this.toggle.type = 'button';
    this.toggle.textContent = input.value === 'on' ? 'ON' : 'OFF';
    this.toggle.className = 'toggle-btn';

    this.toggle.addEventListener('click', () => {
      const newValue = host.inputElement.value === 'on' ? 'off' : 'on';
      host.setValue(newValue);
      this.toggle.textContent = newValue === 'on' ? 'ON' : 'OFF';
    });

    input.hidden = true;
    wrapper.appendChild(this.toggle);
  }

  destroy(): void {
    this.toggle?.remove();
    (this.host?.inputElement as HTMLInputElement).hidden = false;
  }
}
```

Register and use it:

```typescript
registerPlugin('toggle', () => import('./plugins/toggle'));
```

```html
<div data-form-field="notifications" data-field-type="toggle">
  <label>Notifications</label>
  <input type="hidden" name="notifications" value="off" />
</div>
```

## Creating a Custom Form Plugin

Form plugins implement the `FormPlugin` interface and receive `FormPluginHost`:

```typescript
import type { FormPlugin, FormPluginHost } from 'formz';

export default class FormAnalyticsPlugin implements FormPlugin {
  private host!: FormPluginHost;

  async init(formEl: HTMLFormElement, host: FormPluginHost): Promise<void> {
    this.host = host;

    host.on('form:submit', (detail) => {
      analytics.track('form_submit', { formId: detail.formId });
    });

    host.on('form:invalid', (detail) => {
      const invalidFields = Object.entries(detail.state.fields)
        .filter(([, f]) => !f.isValid)
        .map(([name]) => name);
      analytics.track('form_validation_error', { fields: invalidFields });
    });
  }

  destroy(): void {}
}
```
