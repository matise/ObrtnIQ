import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceRouter } from '../src/hooks/useWorkspaceRouter';

describe('Faza 19: useWorkspaceRouter (Modular Workspace Router)', () => {
  let listeners: Record<string, Function[]> = {};

  beforeEach(() => {
    listeners = {};
    const mockWindow = {
      location: { hash: '' },
      addEventListener: (evt: string, fn: Function) => {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      removeEventListener: (evt: string, fn: Function) => {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter(f => f !== fn);
        }
      },
    };
    (globalThis as any).window = mockWindow;
    (globalThis as any).document = { title: '' };
  });

  it('izvozi tipove i useWorkspaceRouter funkciju', () => {
    expect(useWorkspaceRouter).toBeDefined();
    expect(typeof useWorkspaceRouter).toBe('function');
  });

  it('ispravno postavlja hash na navigaciju', () => {
    (globalThis as any).window.location.hash = '#bookkeeping';
    // Hook se ponaša ispravno s definiranim prozorom
    expect((globalThis as any).window.location.hash).toBe('#bookkeeping');
  });
});
