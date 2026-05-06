import type { FieldPluginFactory } from '../types';

const registry = new Map<string, FieldPluginFactory>();

export function registerPlugin(type: string, factory: FieldPluginFactory): void {
  registry.set(type, factory);
}

export function getPluginFactory(type: string): FieldPluginFactory | undefined {
  return registry.get(type);
}

export function hasPlugin(type: string): boolean {
  return registry.has(type);
}
