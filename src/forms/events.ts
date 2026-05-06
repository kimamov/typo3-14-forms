import type {
  FormEventType,
  RegistryEventType,
  FormEventHandler,
  RegistryEventHandler,
} from './types';

type AnyHandler = FormEventHandler | RegistryEventHandler;
type AnyEventType = FormEventType | RegistryEventType;

export class EventBus {
  private listeners = new Map<AnyEventType, Set<AnyHandler>>();

  on(event: AnyEventType, handler: AnyHandler): void {
    let set = this.listeners.get(event);
    if (!set) {
      set = new Set();
      this.listeners.set(event, set);
    }
    set.add(handler);
  }

  off(event: AnyEventType, handler: AnyHandler): void {
    this.listeners.get(event)?.delete(handler);
  }

  emit(event: AnyEventType, detail: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    for (const handler of set) {
      try {
        (handler as (detail: unknown) => void)(detail);
      } catch (err) {
        console.error(`[TYPO3Forms] Error in "${event}" handler:`, err);
      }
    }
  }

  destroy(): void {
    this.listeners.clear();
  }
}
