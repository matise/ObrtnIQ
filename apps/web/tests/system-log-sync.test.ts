import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CoreLogger, LogEntry } from '@obrtniq/core';
import { appLogger } from '../src/services/logger';
import viteConfig from '../vite.config';

describe('Sustavni Dnevnik - Reaktivnost, Referencijalna Stabilnost i COEP/COOP Konfiguracija', () => {
  beforeEach(() => {
    appLogger.clear();
  });

  afterEach(() => {
    appLogger.clear();
  });

  it('SLS-01: appLogger je stabilan singleton usidren na globalnom objektu (__obrtniq_app_logger__)', () => {
    const globalScope = (typeof window !== 'undefined' ? window : globalThis) as any;
    expect(globalScope.__obrtniq_app_logger__).toBeDefined();
    expect(globalScope.__obrtniq_app_logger__).toBe(appLogger);
  });

  it('SLS-02: CoreLogger.getHistory() osigurava referencijalnu jednakost (===) za useSyncExternalStore', () => {
    const logger = new CoreLogger('INFO', 10);
    
    // Inicijalna povijest
    const snapshot1 = logger.getHistory();
    const snapshot2 = logger.getHistory();
    // Referenca mora biti STRIKTNO identična kako React ne bi ušao u beskonačnu petlju
    expect(snapshot1).toBe(snapshot2);
    expect(snapshot1.length).toBe(0);

    // Dodavanje novog zapisa
    logger.info('TEST', 'Prva poruka');
    const snapshot3 = logger.getHistory();
    const snapshot4 = logger.getHistory();

    // Referenca se promijenila nakon logiranja
    expect(snapshot3).not.toBe(snapshot1);
    // Ali uzastopni pozivi bez novih zapisa moraju vraćati identičnu referencu
    expect(snapshot3).toBe(snapshot4);
    expect(snapshot3.length).toBe(1);
    expect(snapshot3[0].message).toBe('Prva poruka');
  });

  it('SLS-03: CoreLogger.clear() obavještava pretplatnike i postavlja novu praznu referencu', () => {
    const logger = new CoreLogger('INFO', 10);
    let notified = false;
    logger.subscribe(() => {
      notified = true;
    });

    logger.info('TEST', 'Privremeni zapis');
    expect(logger.getHistory().length).toBe(1);

    notified = false;
    logger.clear();

    expect(notified).toBe(true);
    const clearedSnapshot = logger.getHistory();
    expect(clearedSnapshot.length).toBe(0);
  });

  it('SLS-04: CoreLogger.setLevel() obavještava pretplatnike pri promjeni praga', () => {
    const logger = new CoreLogger('INFO', 10);
    let notifyCount = 0;
    logger.subscribe(() => {
      notifyCount++;
    });

    logger.setLevel('DEBUG');
    expect(notifyCount).toBe(1);
    expect(logger.level).toBe('DEBUG');

    // Ponovni poziv s istom razinom ne smije nepotrebno okidati pretplatnike
    logger.setLevel('DEBUG');
    expect(notifyCount).toBe(1);
  });

  it('SLS-05: emitTestLog dodaje zapis u appLogger i automatski obavještava UI pretplatnike', () => {
    const testListener = vi.fn();
    const unsubscribe = appLogger.subscribe(testListener);

    // Simulacija poziva funkcije za testni zapis (kao na novom gumbu [⚡ Test])
    const entry = appLogger.scope('DIAGNOSTIKA:TEST').info('Uspješan testni zapis u sustavni dnevnik!', {
      modul: 'DIAGNOSTIKA',
      status: 'OK',
    });

    expect(entry).not.toBeNull();
    expect(testListener).toHaveBeenCalledTimes(1);

    const history = appLogger.getHistory();
    expect(history.length).toBe(1);
    expect(history[0].context).toBe('DIAGNOSTIKA:TEST');
    expect(history[0].message).toContain('testni zapis');

    unsubscribe();
  });

  it('SLS-06: Sigurnosna konfiguracija vite.config.ts omogućuje Google OAuth popup i UserInfo API bez blokada', () => {
    // Čitamo konfiguraciju iz viteConfig objekta
    const config = typeof viteConfig === 'function' ? (viteConfig as any)({}) : viteConfig;
    const serverHeaders = config.server?.headers;
    const previewHeaders = config.preview?.headers;

    expect(serverHeaders).toBeDefined();
    expect(previewHeaders).toBeDefined();

    // COOP mora biti 'same-origin-allow-popups' kako Google OAuth popup prozor ne bi prekinuo komunikaciju s aplikacijom
    expect(serverHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups');
    expect(previewHeaders['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups');

    // COEP mora biti 'credentialless' (a ne 'require-corp') kako Chrome ne bi blokirao Google UserInfo API (https://www.googleapis.com/oauth2/v3/userinfo)
    expect(serverHeaders['Cross-Origin-Embedder-Policy']).toBe('credentialless');
    expect(previewHeaders['Cross-Origin-Embedder-Policy']).toBe('credentialless');
  });

  it('SLS-07: globalna funkcija __obrtniq_emit_test_log__ je dostupna u radnoj memoriji', () => {
    const globalScope = (typeof window !== 'undefined' ? window : globalThis) as any;
    const emitFn = globalScope.__obrtniq_emit_test_log__;
    expect(typeof emitFn).toBe('function');

    emitFn('Poziv iz konzole');
    const history = appLogger.getHistory();
    expect(history.some(e => e.message === 'Poziv iz konzole')).toBe(true);
  });
});
