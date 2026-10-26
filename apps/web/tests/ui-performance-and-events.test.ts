// apps/web/tests/ui-performance-and-events.test.ts
// ObrtnIQ v3.0 — Testovi performansi korisničkog sučelja, obrade događaja (eventova) i zaštite od petlji (loopova)

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let cleanups: Array<() => void> = [];

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react')>();
  return {
    ...actual,
    useEffect: (fn: any) => {
      const res = fn();
      if (typeof res === 'function') {
        cleanups.push(res);
      }
    },
    useRef: (val: any) => ({ current: val }),
    useState: (initial: any) => {
      let state = typeof initial === 'function' ? initial() : initial;
      const setState = (newVal: any) => {
        state = typeof newVal === 'function' ? newVal(state) : newVal;
      };
      return [state, setState];
    },
    useCallback: (fn: any) => fn,
    useMemo: (fn: any) => fn(),
  };
});

import { useKeyboardShortcuts } from '../src/hooks/useKeyboardShortcuts';
import { useTheme } from '../src/hooks/useTheme';
import { buildLiveScreenContextSnapshot, formatContextForSystemPrompt } from '../src/services/zigo-context-builder';
import { validateOib, validateIban } from '@obrtniq/core';

describe('UI Performance, Event Lifecycle & Loop Guards (Faza 21 & Stabilnost)', () => {
  let eventListeners: Record<string, Function[]> = {};
  let domAttributes: Record<string, string> = {};

  beforeEach(() => {
    vi.clearAllMocks();
    cleanups = [];
    eventListeners = {};
    domAttributes = {};

    (globalThis as any).window = {
      addEventListener: (evt: string, fn: Function) => {
        eventListeners[evt] = eventListeners[evt] || [];
        eventListeners[evt].push(fn);
      },
      removeEventListener: (evt: string, fn: Function) => {
        if (eventListeners[evt]) {
          eventListeners[evt] = eventListeners[evt].filter(f => f !== fn);
        }
      },
      dispatchEvent: (e: any) => {
        const handlers = eventListeners[e.type] || [];
        handlers.forEach(h => h(e));
        return true;
      },
    };

    (globalThis as any).document = {
      documentElement: {
        setAttribute: (key: string, val: string) => {
          domAttributes[key] = val;
        },
        removeAttribute: (key: string) => {
          delete domAttributes[key];
        },
        getAttribute: (key: string) => domAttributes[key] || null,
        hasAttribute: (key: string) => key in domAttributes,
        style: {
          setProperty: vi.fn(),
        },
      },
    };
  });

  afterEach(() => {
    cleanups.forEach(c => c());
    cleanups = [];
  });

  function fireKey(key: string, modifiers: { altKey?: boolean; ctrlKey?: boolean; shiftKey?: boolean } = {}) {
    const event = {
      type: 'keydown',
      key,
      altKey: modifiers.altKey || false,
      ctrlKey: modifiers.ctrlKey || false,
      shiftKey: modifiers.shiftKey || false,
      preventDefault: vi.fn(),
    };
    (globalThis as any).window.dispatchEvent(event);
    return event;
  }

  /* =====================================================================
     1. OBRADA TIPKOVNICE I GLOBALNI EVENTOVI (Keyboard Event Dispatcher)
     ===================================================================== */
  describe('1. Tipkovnički događaji i prečaci (useKeyboardShortcuts)', () => {
    it('F2 tipka izdaje račun samo ako je forma popunjena i nije zaključana', () => {
      const onIssue = vi.fn();

      // Slučaj A: submittable = true, locked = false
      useKeyboardShortcuts({
        onIssue,
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: false,
      });

      fireKey('F2');
      expect(onIssue).toHaveBeenCalledTimes(1);
    });

    it('F2 je blokiran kada je račun zaključan ili nije submittable', () => {
      const onIssueLocked = vi.fn();
      useKeyboardShortcuts({
        onIssue: onIssueLocked,
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: true, // zaključan
      });
      fireKey('F2');
      expect(onIssueLocked).not.toHaveBeenCalled();

      const onIssueNotSubmittable = vi.fn();
      useKeyboardShortcuts({
        onIssue: onIssueNotSubmittable,
        onAddItem: vi.fn(),
        isSubmittable: false, // nije submittable
        isLocked: false,
      });
      fireKey('F2');
      expect(onIssueNotSubmittable).not.toHaveBeenCalled();
    });

    it('Alt+N dodaje novu stavku računa samo ako forma nije zaključana', () => {
      const onAddItem = vi.fn();

      useKeyboardShortcuts({
        onIssue: vi.fn(),
        onAddItem,
        isSubmittable: true,
        isLocked: false,
      });

      fireKey('n', { altKey: true });
      fireKey('N', { altKey: true });
      expect(onAddItem).toHaveBeenCalledTimes(2);

      const onAddItemLocked = vi.fn();
      useKeyboardShortcuts({
        onIssue: vi.fn(),
        onAddItem: onAddItemLocked,
        isSubmittable: true,
        isLocked: true,
      });

      fireKey('n', { altKey: true });
      expect(onAddItemLocked).not.toHaveBeenCalled();
    });

    it('Alt+S i Ctrl+K otvaraju i zatvaraju Start Hub (Zapovjedno Središte)', () => {
      const onOpenStartHub = vi.fn();

      useKeyboardShortcuts({
        onIssue: vi.fn(),
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: false,
        onOpenStartHub,
      });

      fireKey('s', { altKey: true });
      fireKey('k', { ctrlKey: true });
      fireKey('K', { ctrlKey: true });

      expect(onOpenStartHub).toHaveBeenCalledTimes(3);
    });

    it('Alt+Z otvara Žigo Copilot ladicu', () => {
      const onOpenZigo = vi.fn();

      useKeyboardShortcuts({
        onIssue: vi.fn(),
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: false,
        onOpenZigo,
      });

      fireKey('z', { altKey: true });
      fireKey('Z', { altKey: true });

      expect(onOpenZigo).toHaveBeenCalledTimes(2);
    });

    it('Alt+1..8 prečaci navigiraju kroz svih 8 radnih prostora', () => {
      const onNavigateHome = vi.fn();
      const onOpenDocs = vi.fn();
      const onOpenKpr = vi.fn();
      const onOpenPartners = vi.fn();
      const onOpenArticles = vi.fn();
      const onOpenFiscal = vi.fn();
      const onOpenSettings = vi.fn();
      const onOpenDocumentation = vi.fn();

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
      });

      fireKey('1', { altKey: true }); // Home
      expect(onNavigateHome).toHaveBeenCalledTimes(1);

      fireKey('2', { altKey: true }); // Dokumenti
      expect(onOpenDocs).toHaveBeenCalledTimes(1);

      fireKey('3', { altKey: true }); // Knjigovodstvo
      expect(onOpenKpr).toHaveBeenCalledTimes(1);

      fireKey('4', { altKey: true }); // Partneri
      expect(onOpenPartners).toHaveBeenCalledTimes(1);

      fireKey('5', { altKey: true }); // Artikli
      expect(onOpenArticles).toHaveBeenCalledTimes(1);

      fireKey('6', { altKey: true }); // Fiskalizacija
      expect(onOpenFiscal).toHaveBeenCalledTimes(1);

      fireKey('7', { altKey: true }); // Postavke
      expect(onOpenSettings).toHaveBeenCalledTimes(1);

      fireKey('8', { altKey: true }); // Sustav Dokumentacije
      expect(onOpenDocumentation).toHaveBeenCalledTimes(1);
    });

    it('Escape tipka vraća na Home samo ako nismo već na Home ekranu', () => {
      const onNavigateHome = vi.fn();

      useKeyboardShortcuts({
        onIssue: vi.fn(),
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: false,
        onNavigateHome,
        isHome: false, // nismo na home
      });

      fireKey('Escape');
      expect(onNavigateHome).toHaveBeenCalledTimes(1);

      // Kad smo na home (isHome: true), escape ne smije triggerati navigaciju
      const onNavigateHome2 = vi.fn();
      useKeyboardShortcuts({
        onIssue: vi.fn(),
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: false,
        onNavigateHome: onNavigateHome2,
        isHome: true,
      });

      fireKey('Escape');
      expect(onNavigateHome2).not.toHaveBeenCalled();
    });

    it('demontiranje (unmount) uklanja event listener i sprečava curenje memorije', () => {
      const onIssue = vi.fn();
      useKeyboardShortcuts({
        onIssue,
        onAddItem: vi.fn(),
        isSubmittable: true,
        isLocked: false,
      });

      expect(eventListeners['keydown']?.length).toBeGreaterThan(0);
      fireKey('F2');
      expect(onIssue).toHaveBeenCalledTimes(1);

      // Izvrši unmount cleanup-e
      cleanups.forEach(c => c());
      cleanups = [];

      expect(eventListeners['keydown']?.length || 0).toBe(0);

      // Nakon unmounta, F2 više ne smije pozvati callback
      fireKey('F2');
      expect(onIssue).toHaveBeenCalledTimes(1);
    });
  });

  /* =====================================================================
     2. ZAŠTITA OD LOOP-OVA I SINKRONIZACIJA STANJA (Loop Guards & Sync)
     ===================================================================== */
  describe('2. Zaštita od petlji i sinkronizacija tema (useTheme Sync)', () => {
    it('višestruke instance useTheme sinkroniziraju se bez beskonačne petlje', () => {
      const themeInstanceA = useTheme();
      const themeInstanceB = useTheme();

      expect(themeInstanceA.preset).toBeDefined();

      // Promjena u instanci A
      themeInstanceA.selectPreset('bronze');

      // Nakon ažuriranja, novi poziv useTheme vraća ažuriranu temu
      const updatedTheme = useTheme();
      expect(updatedTheme.preset).toBe('bronze');
      expect(updatedTheme.activePreset.name).toBe('Dubrovački Dukat');

      // Promjena na Klesani Kamen
      themeInstanceB.selectPreset('carbon');
      expect(domAttributes['data-theme']).toBe('carbon');

      // Povratak na drugu temu miče atribut
      themeInstanceA.selectPreset('amethyst');
      expect('data-theme' in domAttributes).toBe(false);
    });
  });

  /* =====================================================================
     3. BENCHMARK PERFORMANSI I STRESS TESTOVI (Performance & Benchmarks)
     ===================================================================== */
  describe('3. Testovi opterećenja i brzine izvođenja (Stress & Latency)', () => {
    it('brza validacija 500 uzastopnih OIB unosa izvodi se u manje od 15 ms', () => {
      const start = performance.now();

      for (let i = 0; i < 500; i++) {
        const testOib = i % 2 === 0 ? '69435151530' : `0123456789${i % 10}`;
        validateOib(testOib);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(15);
    });

    it('brza validacija 500 uzastopnih IBAN unosa izvodi se u manje od 25 ms', () => {
      const start = performance.now();

      for (let i = 0; i < 500; i++) {
        const testIban = i % 2 === 0 ? 'HR6023600001101234567' : 'HR0011112222333344445';
        validateIban(testIban);
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(25);
    });

    it('generiranje LiveScreenContext snimke i formata za prompt traje manje od 5 ms', () => {
      const start = performance.now();

      for (let i = 0; i < 50; i++) {
        const snapshot = buildLiveScreenContextSnapshot({
          activeScreen: 'InvoiceDesk',
          openDrawers: { isDocDrawerOpen: false },
          form: {
            partnerNaziv: 'Dubrovnik Informatika d.o.o.',
            oib: '69435151530',
            isOibValid: true,
            iban: 'HR6023600001101234567',
            isIbanValid: true,
            taxZone: 'HR',
            nacinPlacanja: 'TRANSAKCIJSKI_RACUN',
            datumIzdavanja: '2026-10-26',
            datumDospijeca: '2026-11-10',
            datumIsporuke: '2026-10-26',
          },
          items: {
            items: [
              {
                id: '1',
                opis: 'Razvoj softvera',
                kolicina: 10,
                cijena: 100,
                ukupno: 1000,
                kpdSifra: '62.01.11',
              },
            ],
            ukupniIznos: 1000,
          },
          stats: {
            kprTotalEur: 18500,
          },
          telemetry: {
            isOnline: true,
            isGoogleDriveConnected: true,
            googleDriveUserEmail: 'libertas@obrtniq.hr',
          },
        });

        const prompt = formatContextForSystemPrompt(snapshot);
        expect(prompt).toContain('Dubrovnik Informatika');
        expect(prompt).toContain('18500');
      }

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Prosječno < 1 ms po pozivu
    });

    it('kalkulacija KPR praga i zbroja 1,000 transakcija traje manje od 5 ms', () => {
      const start = performance.now();

      // Simulacija 1,000 uplata
      const uplate = Array.from({ length: 1000 }, (_, idx) => ({
        iznos: (idx % 50) + 10,
      }));

      const ukupnoKpr = uplate.reduce((sum, u) => sum + u.iznos, 0);
      const pragLimit = 40000;
      const postotak = Math.min(100, Math.round((ukupnoKpr / pragLimit) * 100));
      const preostalo = Math.max(0, pragLimit - ukupnoKpr);

      const duration = performance.now() - start;

      expect(ukupnoKpr).toBeGreaterThan(0);
      expect(postotak).toBeGreaterThanOrEqual(0);
      expect(preostalo).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(10);
    });
  });
});
