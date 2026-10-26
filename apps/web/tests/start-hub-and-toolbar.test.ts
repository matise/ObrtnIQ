// apps/web/tests/start-hub-and-toolbar.test.ts
// Verifikacijski testovi za Start Hub, prečace tipkovnice (Alt+1..8, Alt+Z, Alt+S, Ctrl+K) i Toolbar

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (fn: any) => fn(),
    useRef: (val: any) => ({ current: val }),
  };
});

import { StartHubModal } from '../src/components/layout/StartHubModal';
import { AppHeader } from '../src/components/layout/AppHeader';
import { useKeyboardShortcuts } from '../src/hooks/useKeyboardShortcuts';

describe('Start Hub & Ujednačeni Contextual Toolbar (Redizajn UI)', () => {
  let listeners: Record<string, Function[]> = {};

  beforeEach(() => {
    listeners = {};
    (globalThis as any).window = {
      addEventListener: (evt: string, fn: Function) => {
        listeners[evt] = listeners[evt] || [];
        listeners[evt].push(fn);
      },
      removeEventListener: (evt: string, fn: Function) => {
        if (listeners[evt]) {
          listeners[evt] = listeners[evt].filter((f) => f !== fn);
        }
      },
    };
  });

  it('SH-01: StartHubModal i AppHeader komponente su definirane i validne funkcije', () => {
    expect(StartHubModal).toBeDefined();
    expect(typeof StartHubModal).toBe('function');

    expect(AppHeader).toBeDefined();
    expect(typeof AppHeader).toBe('function');
  });

  it('SH-02: useKeyboardShortcuts registrira i okida Alt+S i Ctrl+K za Start Hub', () => {
    const onOpenStartHub = vi.fn();

    // Postavi hook kroz window listener
    let keydownHandler: any = null;
    (globalThis as any).window.addEventListener = (evt: string, fn: any) => {
      if (evt === 'keydown') keydownHandler = fn;
    };

    useKeyboardShortcuts({
      onIssue: vi.fn(),
      onAddItem: vi.fn(),
      isSubmittable: true,
      isLocked: false,
      onOpenStartHub,
    });

    expect(keydownHandler).not.toBeNull();

    // 1. Alt+S
    const altSEvent = {
      key: 's',
      altKey: true,
      ctrlKey: false,
      preventDefault: vi.fn(),
    };
    keydownHandler(altSEvent);
    expect(altSEvent.preventDefault).toHaveBeenCalled();
    expect(onOpenStartHub).toHaveBeenCalledTimes(1);

    // 2. Ctrl+K
    const ctrlKEvent = {
      key: 'k',
      altKey: false,
      ctrlKey: true,
      preventDefault: vi.fn(),
    };
    keydownHandler(ctrlKEvent);
    expect(ctrlKEvent.preventDefault).toHaveBeenCalled();
    expect(onOpenStartHub).toHaveBeenCalledTimes(2);
  });

  it('SH-03: useKeyboardShortcuts okida brzu navigaciju otocima (Alt+1 do Alt+8, Alt+Z)', () => {
    const onNavigateHome = vi.fn();
    const onOpenDocs = vi.fn();
    const onOpenKpr = vi.fn();
    const onOpenPartners = vi.fn();
    const onOpenArticles = vi.fn();
    const onOpenFiscal = vi.fn();
    const onOpenSettings = vi.fn();
    const onOpenDocumentation = vi.fn();
    const onOpenZigo = vi.fn();

    // Postavi hook kroz window listener
    let keydownHandler: any = null;
    (globalThis as any).window.addEventListener = (evt: string, fn: any) => {
      if (evt === 'keydown') keydownHandler = fn;
    };

    useKeyboardShortcuts({
      onIssue: vi.fn(),
      onAddItem: vi.fn(),
      isSubmittable: true,
      isLocked: false,
      onNavigateHome,
      onOpenDocs,
      onOpenKpr,
      onOpenPartners,
      onOpenArticles,
      onOpenFiscal,
      onOpenSettings,
      onOpenDocumentation,
      onOpenZigo,
    });

    expect(keydownHandler).not.toBeNull();

    // Alt+Z -> Žigo Copilot
    const altZ = { key: 'z', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(altZ);
    expect(altZ.preventDefault).toHaveBeenCalled();
    expect(onOpenZigo).toHaveBeenCalledTimes(1);

    // Alt+1 -> Home
    const alt1 = { key: '1', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt1);
    expect(onNavigateHome).toHaveBeenCalledTimes(1);

    // Alt+2 -> Dokumenti
    const alt2 = { key: '2', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt2);
    expect(onOpenDocs).toHaveBeenCalledTimes(1);

    // Alt+3 -> Knjigovodstvo
    const alt3 = { key: '3', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt3);
    expect(onOpenKpr).toHaveBeenCalledTimes(1);

    // Alt+4 -> Adresar
    const alt4 = { key: '4', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt4);
    expect(onOpenPartners).toHaveBeenCalledTimes(1);

    // Alt+5 -> Cjenik
    const alt5 = { key: '5', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt5);
    expect(onOpenArticles).toHaveBeenCalledTimes(1);

    // Alt+6 -> Fiskalizacija
    const alt6 = { key: '6', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt6);
    expect(onOpenFiscal).toHaveBeenCalledTimes(1);

    // Alt+7 -> Postavke
    const alt7 = { key: '7', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt7);
    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    // Alt+8 -> Dokumentacija
    const alt8 = { key: '8', altKey: true, ctrlKey: false, preventDefault: vi.fn() };
    keydownHandler(alt8);
    expect(onOpenDocumentation).toHaveBeenCalledTimes(1);
  });
});
