import type { FieldPlugin } from './types';
import { FieldController } from './field-controller';
import type { FieldControllerOptions } from './field-controller';
import { getPluginFactory } from './plugins/index';

export type PluginArg =
  | string                       // registry key, e.g. "combobox"
  | (new () => FieldPlugin)      // class reference, e.g. ComboboxPlugin
  | FieldPlugin;                 // pre-built instance

export interface InitFieldOptions extends FieldControllerOptions {
  plugin?: PluginArg;
}

/**
 * Initialize a single field outside of a form context.
 *
 * Accepts either a `[data-form-field]` wrapper element or a bare
 * input/select/textarea (in which case the closest wrapper is used).
 *
 * The optional second argument is an options object:
 *  - `plugin` → controls which plugin to attach:
 *     - `string` → looks up the plugin registry by name
 *     - `class`  → instantiates the plugin directly (no registry needed)
 *     - `instance` → attaches the plugin as-is
 *     - omitted → auto-detects from `data-field-type` via the plugin registry
 *  - `validate`, `onServerErrors`, `renderErrors` → field controller hooks
 *
 * For convenience, a bare PluginArg can also be passed directly as the
 * second argument (e.g. `initField(el, 'combobox')`).
 */
export function initField(
  element: HTMLElement,
  options?: PluginArg | InitFieldOptions,
): FieldController {
  const { plugin, fieldOptions } = normalizeArgs(options);
  const wrapper = resolveWrapper(element);
  const ctrl = new FieldController(wrapper, fieldOptions);
  attachPlugin(ctrl, plugin ?? ctrl.fieldType);
  return ctrl;
}

function isPluginArg(arg: unknown): arg is PluginArg {
  if (typeof arg === 'string' || typeof arg === 'function') return true;
  return typeof arg === 'object' && arg !== null && 'init' in arg && 'destroy' in arg;
}

function normalizeArgs(
  arg?: PluginArg | InitFieldOptions,
): { plugin: PluginArg | undefined; fieldOptions: FieldControllerOptions | undefined } {
  if (arg === undefined) return { plugin: undefined, fieldOptions: undefined };
  if (isPluginArg(arg)) return { plugin: arg, fieldOptions: undefined };
  const { plugin, ...rest } = arg;
  const fieldOptions = Object.keys(rest).length > 0 ? rest : undefined;
  return { plugin, fieldOptions };
}

function attachPlugin(ctrl: FieldController, plugin: PluginArg | null): void {
  if (!plugin) return;

  if (typeof plugin === 'string') {
    const factory = getPluginFactory(plugin);
    if (!factory) return;
    factory()
      .then(({ default: Cls }) => ctrl.attachPlugin(new Cls()))
      .catch((err) => {
        console.warn(`[FormsModule] Failed to load plugin "${plugin}":`, err);
      });
    return;
  }

  if (typeof plugin === 'function') {
    ctrl.attachPlugin(new plugin());
    return;
  }

  ctrl.attachPlugin(plugin);
}

const INPUT_SELECTOR = 'input, select, textarea';

function resolveWrapper(element: HTMLElement): HTMLElement {
  if (element.hasAttribute('data-form-field')) {
    return element;
  }

  if (element.matches(INPUT_SELECTOR)) {
    const parent = element.closest<HTMLElement>('[data-form-field]');
    if (parent) return parent;
  }

  throw new Error(
    '[FormsModule] initField() expects a [data-form-field] wrapper or an input inside one.',
  );
}
