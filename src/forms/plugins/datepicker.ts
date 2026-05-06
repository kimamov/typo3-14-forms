import type { FieldPlugin, FieldPluginHost } from '../types';


const PHP_TO_AIR: Record<string, string> = {
  Y: 'yyyy', y: 'yy',
  m: 'MM',   n: 'M',
  d: 'dd',   j: 'd',
};

function phpFormatToAir(php: string): string {
  let out = '';
  for (let i = 0; i < php.length; i++) {
    const ch = php[i];
    if (ch === '\\' && i + 1 < php.length) {
      out += php[++i];
    } else {
      out += PHP_TO_AIR[ch] ?? ch;
    }
  }
  return out;
}

/**
 * Progressive enhancement: wraps the text input rendered by
 * `formvh:form.datePicker` (with enableDatePicker=false) with
 * Air Datepicker.  If the library fails to load the plain text
 * input remains fully functional.
 */
export default class DatePickerPlugin implements FieldPlugin {
  private picker: AirDatepicker | null = null;

  async init(_wrapper: HTMLElement, host: FieldPluginHost): Promise<void> {
    const input = host.inputElement as HTMLInputElement;
    const phpFormat = input.closest('[data-field-type]')
      ?.querySelector<HTMLInputElement>('input[type="hidden"][name$="[dateFormat]"]')
      ?.value ?? 'Y-m-d';

    const airFormat = phpFormatToAir(phpFormat);

    const { default: AirDatepicker } = await import('air-datepicker');
    await import('air-datepicker/air-datepicker.css');
    const enModule = await import('air-datepicker/locale/en');
    const locale = enModule.default?.days ? enModule.default : enModule.default?.default ?? enModule;

    const initial = input.value ? this.parseByFormat(input.value, phpFormat) : undefined;

    this.picker = new AirDatepicker(input, {
      dateFormat: airFormat,
      autoClose: true,
      isMobile: window.matchMedia('(pointer: coarse)').matches,
      selectedDates: initial ? [initial] : undefined,
      buttons: ['today', 'clear'],
      locale,
      onSelect: ({ date }) => {
        const d = Array.isArray(date) ? date[0] : date;
        if (!d) {
          input.value = '';
        }
        host.setValue(input.value);
      },
    });
  }

  destroy(): void {
    this.picker?.destroy();
    this.picker = null;
  }

  private parseByFormat(value: string, phpFormat: string): Date | undefined {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(value + 'T00:00:00');
      return Number.isNaN(d.getTime()) ? undefined : d;
    }

    const tokens = phpFormat.match(/[YymndjFM]/g) ?? [];
    const parts = value.split(/[\s./-]+/);
    let year = 2000, month = 0, day = 1;

    tokens.forEach((t, i) => {
      const n = parseInt(parts[i], 10);
      if (Number.isNaN(n)) return;
      switch (t) {
        case 'Y': year = n; break;
        case 'y': year = n < 50 ? 2000 + n : 1900 + n; break;
        case 'm': case 'n': month = n - 1; break;
        case 'd': case 'j': day = n; break;
      }
    });

    const d = new Date(year, month, day);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
}

type AirDatepicker = import('air-datepicker').default;
