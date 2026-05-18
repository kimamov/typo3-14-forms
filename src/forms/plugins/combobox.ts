import type { FieldPlugin, FieldPluginHost } from '../types';

interface ComboboxOption {
  value: string;
  label: string;
}

/**
 * Accessible combobox (ARIA 1.2 pattern) that progressively enhances a <select>.
 *
 * The original <select> is hidden and kept in sync so server-side form
 * submission still works. The combobox renders a text input with a
 * filterable listbox popup.
 */
export default class ComboboxPlugin implements FieldPlugin {
  private host!: FieldPluginHost;
  private select!: HTMLSelectElement;
  private options: ComboboxOption[] = [];

  private root!: HTMLElement;
  private input!: HTMLInputElement;
  private listbox!: HTMLElement;
  private toggle!: HTMLButtonElement;

  private activeIndex = -1;
  private isOpen = false;
  private filteredOptions: ComboboxOption[] = [];
  private abortController = new AbortController();

  async init(wrapper: HTMLElement, host: FieldPluginHost): Promise<void> {
    this.host = host;

    const select = wrapper.querySelector('select');
    if (!select) return;
    this.select = select;

    this.options = Array.from(select.options)
      .filter((o) => o.value !== '')
      .map((o) => ({ value: o.value, label: o.textContent?.trim() ?? o.value }));
    this.filteredOptions = [...this.options];

    this.buildDOM(wrapper);
    this.syncFromSelect();
    this.bind();
  }

  destroy(): void {
    this.abortController.abort();
    if (this.select) {
      this.select.hidden = false;
      this.select.removeAttribute('tabindex');
      this.select.removeAttribute('aria-hidden');
    }
    this.root?.remove();
  }

  private buildDOM(wrapper: HTMLElement): void {
    const id = this.select.id || `cb-${this.host.name}`;

    this.select.hidden = true;
    this.select.setAttribute('tabindex', '-1');
    this.select.setAttribute('aria-hidden', 'true');

    this.root = document.createElement('div');
    this.root.className = 'combobox';

    this.input = document.createElement('input');
    this.input.type = 'text';
    this.input.className = 'combobox-input';
    this.input.setAttribute('role', 'combobox');
    this.input.setAttribute('aria-autocomplete', 'list');
    this.input.setAttribute('aria-expanded', 'false');
    this.input.setAttribute('aria-controls', `${id}-listbox`);
    this.input.setAttribute('aria-haspopup', 'listbox');
    this.input.setAttribute('autocomplete', 'off');

    const label = wrapper.querySelector('label');
    if (label) {
      const labelId = label.id || `${id}-label`;
      label.id = labelId;
      this.input.setAttribute('aria-labelledby', labelId);
    }

    this.toggle = document.createElement('button');
    this.toggle.type = 'button';
    this.toggle.className = 'combobox-toggle';
    this.toggle.setAttribute('aria-label', 'Toggle options');
    this.toggle.setAttribute('tabindex', '-1');
    this.toggle.innerHTML = '<svg width="12" height="8" viewBox="0 0 12 8" aria-hidden="true"><path d="M1 1l5 5 5-5" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>';

    this.listbox = document.createElement('ul');
    this.listbox.id = `${id}-listbox`;
    this.listbox.className = 'combobox-listbox';
    this.listbox.setAttribute('role', 'listbox');
    this.listbox.hidden = true;

    this.renderOptions();

    const inputWrap = document.createElement('div');
    inputWrap.className = 'combobox-input-wrap';
    inputWrap.append(this.input, this.toggle);

    this.root.append(inputWrap, this.listbox);
    this.select.insertAdjacentElement('afterend', this.root);

    this.host.replaceInput(this.input);
  }

  private bind(): void {
    const signal = this.abortController.signal;

    this.input.addEventListener('input', () => this.onInput(), { signal });
    this.input.addEventListener('keydown', (e) => this.onKeydown(e), { signal });
    this.input.addEventListener('focus', () => this.open(), { signal });
    this.input.addEventListener('blur', (e) => this.onBlur(e), { signal });
    this.toggle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      this.isOpen ? this.close() : this.open();
      this.input.focus();
    }, { signal });
    this.listbox.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const li = (e.target as HTMLElement).closest<HTMLElement>('[role="option"]');
      if (li) this.selectOption(li.dataset['value'] ?? '');
    }, { signal });
  }

  private onInput(): void {
    const query = this.input.value.toLowerCase().trim();
    this.filteredOptions = query
      ? this.options.filter((o) => o.label.toLowerCase().includes(query))
      : [...this.options];
    this.activeIndex = -1;
    this.renderOptions();
    this.open();
  }

  private onKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen) { this.open(); return; }
        this.moveActive(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.isOpen) { this.open(); return; }
        this.moveActive(-1);
        break;
      case 'Enter':
        e.preventDefault();
        if (this.isOpen && this.activeIndex >= 0) {
          this.selectOption(this.filteredOptions[this.activeIndex].value);
        }
        break;
      case 'Escape':
        if (this.isOpen) {
          e.preventDefault();
          this.close();
        }
        break;
      case 'Home':
        if (this.isOpen) {
          e.preventDefault();
          this.setActive(0);
        }
        break;
      case 'End':
        if (this.isOpen) {
          e.preventDefault();
          this.setActive(this.filteredOptions.length - 1);
        }
        break;
    }
  }

  private onBlur(e: FocusEvent): void {
    const related = e.relatedTarget as HTMLElement | null;
    if (this.root.contains(related)) return;
    this.close();
    this.commitInputValue();
  }

  private commitInputValue(): void {
    const text = this.input.value.trim().toLowerCase();
    const match = this.options.find((o) => o.label.toLowerCase() === text);
    if (match) {
      this.applySelection(match);
    } else if (text === '') {
      this.select.value = '';
      this.host.setValue('');
    } else {
      const prev = this.options.find((o) => o.value === this.select.value);
      this.input.value = prev?.label ?? '';
    }
  }

  private open(): void {
    if (this.isOpen) return;
    this.isOpen = true;
    this.listbox.hidden = false;
    this.input.setAttribute('aria-expanded', 'true');
  }

  private close(): void {
    if (!this.isOpen) return;
    this.isOpen = false;
    this.listbox.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.activeIndex = -1;
    this.clearActiveDescendant();
  }

  private selectOption(value: string): void {
    const opt = this.options.find((o) => o.value === value);
    if (!opt) return;
    this.applySelection(opt);
    this.close();
    this.input.focus();
  }

  private applySelection(opt: ComboboxOption): void {
    this.input.value = opt.label;
    this.select.value = opt.value;
    this.host.setValue(opt.value);
    this.filteredOptions = [...this.options];
    this.renderOptions();
  }

  private moveActive(delta: number): void {
    const len = this.filteredOptions.length;
    if (len === 0) return;
    let next = this.activeIndex + delta;
    if (next < 0) next = len - 1;
    if (next >= len) next = 0;
    this.setActive(next);
  }

  private setActive(index: number): void {
    this.activeIndex = index;
    const items = this.listbox.querySelectorAll<HTMLElement>('[role="option"]');
    items.forEach((el, i) => {
      const active = i === index;
      el.setAttribute('aria-selected', String(active));
      if (active) {
        this.input.setAttribute('aria-activedescendant', el.id);
        el.scrollIntoView({ block: 'nearest' });
      }
    });
  }

  private clearActiveDescendant(): void {
    this.listbox.querySelectorAll('[aria-selected="true"]').forEach((el) => {
      el.setAttribute('aria-selected', 'false');
    });
  }

  private renderOptions(): void {
    const selectedValue = this.select.value;
    const id = this.listbox.id;

    this.listbox.innerHTML = this.filteredOptions.length === 0
      ? '<li class="combobox-no-results" role="presentation">No results</li>'
      : this.filteredOptions
          .map((opt, i) => {
            const selected = opt.value === selectedValue;
            return `<li id="${id}-opt-${i}" role="option" aria-selected="${selected}" data-value="${this.escapeAttr(opt.value)}" class="combobox-option${selected ? ' is-selected' : ''}">${this.escapeHtml(opt.label)}</li>`;
          })
          .join('');
  }

  private syncFromSelect(): void {
    const val = this.select.value;
    const opt = this.options.find((o) => o.value === val);
    this.input.value = opt?.label ?? '';
  }

  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  private escapeAttr(str: string): string {
    return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }
}
