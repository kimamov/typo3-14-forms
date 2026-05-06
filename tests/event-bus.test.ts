import { describe, it, expect, vi } from 'vitest';
import { EventBus } from '../src/forms/events';

describe('EventBus', () => {
  
  it('calls registered handler on emit', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('field:change', handler);
    bus.emit('field:change', { name: 'test' });

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith({ name: 'test' });
  });

  it('supports multiple handlers for the same event', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('field:valid', h1);
    bus.on('field:valid', h2);
    bus.emit('field:valid', { ok: true });

    expect(h1).toHaveBeenCalledOnce();
    expect(h2).toHaveBeenCalledOnce();
  });

  it('does not call handlers for different events', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('field:valid', handler);
    bus.emit('field:invalid', { ok: false });

    expect(handler).not.toHaveBeenCalled();
  });

  it('removes handler with off()', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('field:change', handler);
    bus.off('field:change', handler);
    bus.emit('field:change', {});

    expect(handler).not.toHaveBeenCalled();
  });

  it('clears all listeners on destroy()', () => {
    const bus = new EventBus();
    const h1 = vi.fn();
    const h2 = vi.fn();

    bus.on('field:change', h1);
    bus.on('form:submit', h2);
    bus.destroy();

    bus.emit('field:change', {});
    bus.emit('form:submit', {});

    expect(h1).not.toHaveBeenCalled();
    expect(h2).not.toHaveBeenCalled();
  });

  it('does not throw when emitting with no handlers', () => {
    const bus = new EventBus();
    expect(() => bus.emit('field:change', {})).not.toThrow();
  });

  it('catches and logs handler errors without breaking other handlers', () => {
    const bus = new EventBus();
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const good = vi.fn();

    bus.on('field:change', () => { throw new Error('oops'); });
    bus.on('field:change', good);
    bus.emit('field:change', {});

    expect(good).toHaveBeenCalledOnce();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('handles registry event types', () => {
    const bus = new EventBus();
    const handler = vi.fn();

    bus.on('form:registered', handler);
    bus.emit('form:registered', { formId: 'contact' });

    expect(handler).toHaveBeenCalledWith({ formId: 'contact' });
  });
});
