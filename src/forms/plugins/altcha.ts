import type { FieldPlugin, FieldPluginHost } from '../types';
import type { Configuration, State, WidgetMethods } from 'altcha/types';

type AltchaWidget = HTMLElement & WidgetMethods;

interface StateChangeDetail {
  state: State;
  payload?: string;
}

/**
 * Progressive enhancement: wraps a hidden input rendered by the server
 * with an ALTCHA proof-of-work captcha widget.
 *
 * Expected HTML structure:
 *   <div data-form-field="altcha-1" data-field-type="altcha">
 *     <input type="hidden" name="altcha-1" value="">
 *     <!-- Optional: data-altcha-challenge='{"parameters":{...},"signature":"..."}' -->
 *     <!-- Optional: data-altcha-challenge-url="https://..." -->
 *   </div>
 *
 * The challenge can be provided as:
 *   - Inline JSON via `data-altcha-challenge` on the wrapper
 *   - A URL via `data-altcha-challenge-url` on the wrapper
 *   - A hidden input with name ending in `[challenge]` containing JSON
 */
export default class AltchaPlugin implements FieldPlugin {
  private host!: FieldPluginHost;
  private widget: AltchaWidget | null = null;
  private liveRegion: HTMLElement | null = null;
  private abortController = new AbortController();

  async init(wrapper: HTMLElement, host: FieldPluginHost): Promise<void> {
    this.host = host;

    await import('altcha');
    await this.loadI18n();

    const challenge = this.resolveChallenge(wrapper);

    this.widget = document.createElement('altcha-widget') as AltchaWidget;

    if (typeof challenge === 'string' && challenge.startsWith('http')) {
      this.widget.setAttribute('challenge', challenge);
    } else if (challenge) {
      this.widget.setAttribute('challenge', typeof challenge === 'string' ? challenge : JSON.stringify(challenge));
    }

    this.widget.setAttribute('auto', 'onfocus');
    this.widget.setAttribute('hidelogo', 'true');
    this.widget.setAttribute('hidefooter', 'true');
    this.widget.setAttribute('name', `_altcha_internal_${host.name}`);

    const lang = this.detectLanguage();
    if (lang) {
      this.widget.setAttribute('language', lang);
    }

    this.liveRegion = document.createElement('span');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'visually-hidden';

    const container = document.createElement('div');
    container.className = 'altcha-container';
    container.append(this.widget, this.liveRegion);

    const input = host.inputElement;
    input.insertAdjacentElement('afterend', container);

    this.bind();
  }

  destroy(): void {
    this.abortController.abort();
    const container = this.widget?.closest('.altcha-container');
    this.widget = null;
    this.liveRegion = null;
    container?.remove();
  }

  private bind(): void {
    if (!this.widget) return;
    const signal = this.abortController.signal;

    this.widget.addEventListener('statechange', (ev: Event) => {
      const detail = (ev as CustomEvent<StateChangeDetail>).detail;
      if (!detail) return;

      this.announceState(detail.state);

      if (detail.state === 'verified' && detail.payload) {
        this.host.setValue(detail.payload);
      } else {
        this.host.setValue('');
      }
    }, { signal });

    this.widget.addEventListener('verified', (ev: Event) => {
      const target = ev.target;
      if (!(target instanceof HTMLElement)) return;

      const checkbox = target.querySelector<HTMLInputElement>('input[type="checkbox"]');
      if (checkbox) {
        checkbox.disabled = true;
      }
    }, { signal });
  }

  private announceState(state: string): void {
    if (!this.liveRegion || !this.widget) return;

    try {
      if (typeof this.widget.getConfiguration === 'function') {
        const config = this.widget.getConfiguration() as Configuration & { strings?: Record<string, string> };
        const strings = config.strings ?? {};
        this.liveRegion.textContent = strings[state] ?? '';
        return;
      }
    } catch { /* widget not yet ready */ }

    this.liveRegion.textContent = '';
  }

  private resolveChallenge(wrapper: HTMLElement): string | object | null {
    const jsonAttr = wrapper.getAttribute('data-altcha-challenge');
    if (jsonAttr) {
      try {
        return JSON.parse(jsonAttr);
      } catch {
        return jsonAttr;
      }
    }

    const urlAttr = wrapper.getAttribute('data-altcha-challenge-url');
    if (urlAttr) return urlAttr;

    const hiddenInput = wrapper.querySelector<HTMLInputElement>('input[type="hidden"][name$="[challenge]"]');
    if (hiddenInput?.value) {
      try {
        return JSON.parse(hiddenInput.value);
      } catch {
        return hiddenInput.value;
      }
    }

    return null;
  }

  private detectLanguage(): string | null {
    const htmlLang = document.documentElement.lang;
    if (htmlLang) {
      return htmlLang.split('-')[0].toLowerCase();
    }
    return null;
  }

  private async loadI18n(): Promise<void> {
    const lang = this.detectLanguage();
    if (!lang || lang === 'en') return;

    try {
      await import(`altcha/i18n/${lang}`);
    } catch {
      /* translation not available — widget falls back to English */
    }
  }
}
