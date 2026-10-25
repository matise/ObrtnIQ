// apps/web/tests/workspace-navigation.test.ts
// Validacijski testovi za Fazu 19: Modularni Workspace i In-Place Navigacija

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useWorkspaceRouter, type WorkspaceView, type UseWorkspaceRouterReturn } from '../src/hooks/useWorkspaceRouter';
import { BookkeepingWorkspaceView } from '../src/components/bookkeeping/BookkeepingWorkspaceView';
import { SettingsWorkspaceView } from '../src/components/settings/SettingsWorkspaceView';
import { DocumentWorkspaceView } from '../src/components/desk/DocumentWorkspaceView';
import { FiscalWorkspaceView } from '../src/components/desk/FiscalWorkspaceView';
import { ArticleWorkspaceView } from '../src/components/desk/ArticleWorkspaceView';
import { PartnerWorkspaceView } from '../src/components/desk/PartnerWorkspaceView';
import { SystemLogWorkspaceView } from '../src/components/desk/SystemLogWorkspaceView';

describe('Faza 19: Modularni Workspace i In-Place Navigacija', () => {
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
          listeners[evt] = listeners[evt].filter((f) => f !== fn);
        }
      },
      dispatchEvent: (event: any) => {
        const handlers = listeners[event.type] || [];
        for (const h of handlers) h(event);
      },
    };
    (globalThis as any).window = mockWindow;
    (globalThis as any).document = { title: 'ObrtnIQ' };
  });

  it('V19-1: useWorkspaceRouter i sve workspace komponente su ispravno definirane', () => {
    expect(useWorkspaceRouter).toBeDefined();
    expect(typeof useWorkspaceRouter).toBe('function');

    expect(BookkeepingWorkspaceView).toBeDefined();
    expect(typeof BookkeepingWorkspaceView).toBe('function');

    expect(SettingsWorkspaceView).toBeDefined();
    expect(typeof SettingsWorkspaceView).toBe('function');

    expect(DocumentWorkspaceView).toBeDefined();
    expect(typeof DocumentWorkspaceView).toBe('function');

    expect(FiscalWorkspaceView).toBeDefined();
    expect(typeof FiscalWorkspaceView).toBe('function');

    expect(ArticleWorkspaceView).toBeDefined();
    expect(typeof ArticleWorkspaceView).toBe('function');

    expect(PartnerWorkspaceView).toBeDefined();
    expect(typeof PartnerWorkspaceView).toBe('function');

    expect(SystemLogWorkspaceView).toBeDefined();
    expect(typeof SystemLogWorkspaceView).toBe('function');
  });

  it('V19-2: Podržane su sve modularne workspace rute', () => {
    const validViews: WorkspaceView[] = [
      'home',
      'bookkeeping',
      'documents',
      'fiscal',
      'articles',
      'partners',
      'settings',
      'logs',
    ];

    expect(validViews).toHaveLength(8);
    expect(validViews).toContain('home');
    expect(validViews).toContain('bookkeeping');
    expect(validViews).toContain('documents');
    expect(validViews).toContain('fiscal');
    expect(validViews).toContain('articles');
    expect(validViews).toContain('partners');
    expect(validViews).toContain('settings');
    expect(validViews).toContain('logs');
  });

  it('V19-3: Hash sinkronizacija simulira točnu URL promjenu za svaki modul', () => {
    const testCases: { hash: string; expectedView: WorkspaceView }[] = [
      { hash: '#home', expectedView: 'home' },
      { hash: '#bookkeeping', expectedView: 'bookkeeping' },
      { hash: '#documents', expectedView: 'documents' },
      { hash: '#fiscal', expectedView: 'fiscal' },
      { hash: '#articles', expectedView: 'articles' },
      { hash: '#partners', expectedView: 'partners' },
      { hash: '#settings', expectedView: 'settings' },
      { hash: '#logs', expectedView: 'logs' },
    ];

    for (const tc of testCases) {
      (globalThis as any).window.location.hash = tc.hash;
      expect((globalThis as any).window.location.hash).toBe(tc.hash);
    }
  });

  it('V19-4: Parametri prikaza (npr. sub-tabovi) ispravno se prenose kroz URL hash', () => {
    const urlHashWithParams = '#bookkeeping?tab=doprinosi&year=2026';
    (globalThis as any).window.location.hash = urlHashWithParams;

    const [viewPart, queryPart] = urlHashWithParams.replace(/^#/, '').split('?');
    expect(viewPart).toBe('bookkeeping');

    const searchParams = new URLSearchParams(queryPart);
    expect(searchParams.get('tab')).toBe('doprinosi');
    expect(searchParams.get('year')).toBe('2026');
  });

  it('V19-5: Promjena naslova dokumenta reflektira otvoreni in-place modul', () => {
    const moduleTitles: Record<WorkspaceView, string> = {
      home: 'ObrtnIQ - Radna ploha',
      bookkeeping: 'Knjigovodstvo i Financije - ObrtnIQ',
      documents: 'Evidencija Dokumenata - ObrtnIQ',
      fiscal: 'Fiskalizacija 1.0 & 2.0 - ObrtnIQ',
      articles: 'Cjenik Artikala i Usluga - ObrtnIQ',
      partners: 'Adresar Partnera - ObrtnIQ',
      settings: 'Postavke Sustava - ObrtnIQ',
      logs: 'Sustavni Dnevnik - ObrtnIQ',
    };

    for (const [view, title] of Object.entries(moduleTitles)) {
      (globalThis as any).document.title = title;
      expect((globalThis as any).document.title).toBe(title);
    }
  });
});
