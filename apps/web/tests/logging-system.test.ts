import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CoreLogger, parseStackTrace } from '@obrtniq/core';
import { 
  getAutoOpenOnError, 
  setAutoOpenOnError, 
  onAutoOpenTriggered, 
  triggerAutoOpen 
} from '../src/services/global-error-trap';

// Mock localStorage za testno okruženje
const mockStorage: Record<string, string> = {};
beforeEach(() => {
  for (const key of Object.keys(mockStorage)) {
    delete mockStorage[key];
  }
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
    clear: () => {
      for (const key of Object.keys(mockStorage)) delete mockStorage[key];
    },
  });
});

describe('Među-faza 10.5: Sveobuhvatni Dijagnostički & Telemetrijski Sustav', () => {
  it('L-01: CoreLogger poštuje hijerarhiju prioriteta razina (Level Threshold)', () => {
    const logger = new CoreLogger('WARN', 10);

    expect(logger.isLevelEnabled('ERROR')).toBe(true);
    expect(logger.isLevelEnabled('WARN')).toBe(true);
    expect(logger.isLevelEnabled('INFO')).toBe(false);
    expect(logger.isLevelEnabled('DEBUG')).toBe(false);
    expect(logger.isLevelEnabled('VERBOSE')).toBe(false);

    logger.info('TEST', 'Ova INFO poruka ne smije ući u spremnik');
    logger.debug('TEST', 'Ova DEBUG poruka ne smije ući u spremnik');
    logger.warn('TEST', 'Ova WARN poruka ulazi u spremnik');
    logger.error('TEST', 'Ova ERROR poruka ulazi u spremnik');

    const history = logger.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].level).toBe('WARN');
    expect(history[1].level).toBe('ERROR');
  });

  it('L-02: Sanitizacija automatski maskira osjetljive podatke (passwords, tokens, secrets)', () => {
    const logger = new CoreLogger('DEBUG', 10);
    const sensitivePayload = {
      user: 'matija',
      password: 'SuperSecretPassword123!',
      apiToken: 'AIzaSy1234567890',
      privateKey: '-----BEGIN PRIVATE KEY-----',
      nested: {
        oauthSecret: 'very_secret_key',
        safeProperty: 'normal_data',
      },
    };

    const entry = logger.debug('AUTH:TEST', 'Provjera sanitizacije', sensitivePayload);
    expect(entry).not.toBeNull();
    const data = entry?.data as Record<string, any>;

    expect(data.user).toBe('matija');
    expect(data.password).toBe('***REDACTED***');
    expect(data.apiToken).toBe('***REDACTED***');
    expect(data.privateKey).toBe('***REDACTED***');
    expect(data.nested.oauthSecret).toBe('***REDACTED***');
    expect(data.nested.safeProperty).toBe('normal_data');
  });

  it('L-03: Stack Trace Parser strukturira V8 i Web okvire te označava aplikacijski kod', () => {
    const sampleStack = `Error: Krah u izračunu
    at calculateTotals (http://localhost:5173/src/utils/calculator.ts:150:12)
    at runAction (http://localhost:5173/src/hooks/useInvoiceWorkflow.ts:98:5)
    at Object.invoke (http://localhost:5173/node_modules/react/index.js:40:15)`;

    const frames = parseStackTrace(sampleStack);
    expect(frames.length).toBe(3);

    // Prvi okvir: aplikacijski kod
    expect(frames[0].functionName).toBe('calculateTotals');
    expect(frames[0].lineNumber).toBe(150);
    expect(frames[0].columnNumber).toBe(12);
    expect(frames[0].isAppCode).toBe(true);
    expect(frames[0].relativePath).toBe('src/utils/calculator.ts');

    // Drugi okvir: aplikacijski kod
    expect(frames[1].functionName).toBe('runAction');
    expect(frames[1].isAppCode).toBe(true);
    expect(frames[1].relativePath).toBe('src/hooks/useInvoiceWorkflow.ts');

    // Treći okvir: vanjski paket
    expect(frames[2].isAppCode).toBe(false);
  });

  it('L-04: Auto-Open on Error mehanizam dispečira signal pretplatnicima', () => {
    setAutoOpenOnError(true);
    expect(getAutoOpenOnError()).toBe(true);

    const receivedEntries: any[] = [];
    const unsubscribe = onAutoOpenTriggered((entry) => {
      receivedEntries.push(entry);
    });

    const mockErrorEntry = {
      id: 'log-err-1',
      timestamp: new Date().toISOString(),
      displayTime: '12:00:00.000',
      level: 'ERROR' as const,
      context: 'TEST:TRIGGER',
      message: 'Kritična greška u servisu',
    };

    triggerAutoOpen(mockErrorEntry);
    expect(receivedEntries.length).toBe(1);
    expect(receivedEntries[0].id).toBe('log-err-1');

    unsubscribe();
    triggerAutoOpen(mockErrorEntry);
    expect(receivedEntries.length).toBe(1); // nije se povećalo nakon unsubscribe
  });

  it('L-05: Postavka Auto-Open on Error se može isključiti i perzistira se u localStorage', () => {
    setAutoOpenOnError(false);
    expect(getAutoOpenOnError()).toBe(false);
    expect(mockStorage['obrtniq_auto_open_log_on_error']).toBe('false');

    setAutoOpenOnError(true);
    expect(getAutoOpenOnError()).toBe(true);
    expect(mockStorage['obrtniq_auto_open_log_on_error']).toBe('true');
  });

  it('L-06: Prstenasti buffer (RingBuffer) garantira FIFO ponašanje bez memory leaka', () => {
    const logger = new CoreLogger('INFO', 5); // kapacitet točno 5 zapisa

    for (let i = 1; i <= 8; i++) {
      logger.info('LOOP', `Poruka broj ${i}`);
    }

    const history = logger.getHistory();
    expect(history.length).toBe(5);

    // Prva u memoriji mora biti poruka br. 4, a zadnja poruka br. 8
    expect(history[0].message).toBe('Poruka broj 4');
    expect(history[4].message).toBe('Poruka broj 8');
  });
});
