import type { FieldPlugin } from './types';
import { FieldController } from './field-controller';
import type { FieldControllerOptions } from './field-controller';
import { getPluginFactory } from './plugins/index';

type PluginArg =
  | string                       // registry key, e.g. "combobox"
  | (new () => FieldPlugin)      // class reference, e.g. ComboboxPlugin
  | FieldPlugin;                 // pre-built instance

/**
 * Initialize a single field outside of a form context.
 *
 * Accepts either a `[data-form-field]` wrapper element or a bare
 * input/select/textarea (in which case the closest wrapper is used).
 *
 * The optional second argument controls plugin loading:
 *  - omitted → auto-detects from `data-field-type` via the plugin registry
 *  - `string` → looks up the plugin registry by name
 *  - `class`  → instantiates the plugin directly (no registry needed)
 *  - `instance` → attaches the plugin as-is
 */
export function initField(
  element: HTMLElement,
  plugin?: PluginArg,
  options?: FieldControllerOptions,
): FieldController {
  const wrapper = resolveWrapper(element);
  const ctrl = new FieldController(wrapper, options);
  attachPlugin(ctrl, plugin ?? ctrl.fieldType);
  return ctrl;
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
