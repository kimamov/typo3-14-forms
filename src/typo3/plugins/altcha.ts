import type { FieldPlugin, FieldPluginHost } from '../../forms/types';
import type { Configuration, State, WidgetMethods } from 'altcha/types';

type AltchaWidget = HTMLElement & WidgetMethods;

interface StateChangeDetail {
  state: State;
  payload?: string;
}

/**
 * TYPO3-specific ALTCHA field plugin.
 *
 * Works with the `bbysaeth/typo3-altcha` extension which provides:
 *   - Challenge generation endpoints (uncached `/?type=1768669000` or proxy)
 *   - Server-side validation via `AltchaValidator`
 *   - Database-backed anti-replay protection
 *
 * The Fluid partial (`Altcha.fluid.html`) renders a hidden input with
 * `data-altcha-challenge` containing the challenge endpoint URL.
 * This plugin creates the `<altcha-widget>` dynamically and syncs
 * the verified payload back to the hidden input via `host.setValue()`.
 */
export default class Typo3AltchaPlugin implements FieldPlugin {
  private host!: FieldPluginHost;
  private widget: AltchaWidget | null = null;
  private liveRegion: HTMLElement | null = null;
  private abortController = new AbortController();

  async init(_wrapper: HTMLElement, host: FieldPluginHost): Promise<void> {
    this.host = host;

    await import('altcha');
    await this.loadI18n();

    const challenge = this.resolveChallenge(host);

    this.widget = document.createElement('altcha-widget') as AltchaWidget;

    if (challenge) {
      this.widget.setAttribute('challenge', challenge);
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

    host.inputElement.insertAdjacentElement('afterend', container);

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

  private resolveChallenge(host: FieldPluginHost): string | null {
    return host.inputElement.getAttribute('data-altcha-challenge');
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
