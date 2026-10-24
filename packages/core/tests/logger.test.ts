import { describe, it, expect, vi } from 'vitest';
import { 
  CoreLogger, 
  RingBuffer, 
  LogLevel,
  LogEntry 
} from '../src/logger';

describe('Logging Engine - RingBuffer', () => {
  it('ispravno pohranjuje elemente do maksimalnog kapaciteta', () => {
    const buffer = new RingBuffer<number>(3);
    expect(buffer.size).toBe(0);

    buffer.push(1);
    buffer.push(2);
    expect(buffer.size).toBe(2);
    expect(buffer.toArray()).toEqual([1, 2]);

    buffer.push(3);
    expect(buffer.size).toBe(3);
    expect(buffer.toArray()).toEqual([1, 2, 3]);

    // Prekoračenje kapaciteta - najstariji (1) se odbacuje, dodaje se 4
    buffer.push(4);
    expect(buffer.size).toBe(3);
    expect(buffer.toArray()).toEqual([2, 3, 4]);

    buffer.push(5);
    expect(buffer.toArray()).toEqual([3, 4, 5]);
  });

  it('ispravno prazni buffer metodom clear()', () => {
    const buffer = new RingBuffer<string>(5);
    buffer.push('a');
    buffer.push('b');
    expect(buffer.size).toBe(2);

    buffer.clear();
    expect(buffer.size).toBe(0);
    expect(buffer.toArray()).toEqual([]);
  });
});

describe('Logging Engine - CoreLogger', () => {
  it('filtrira zapise prema definiranom pragu razine', () => {
    const logger = new CoreLogger('INFO', 10);

    // Na razini INFO, DEBUG i VERBOSE se ignoriraju
    const debugEntry = logger.debug('CORE:TEST', 'Ovo je debug');
    const verboseEntry = logger.verbose('CORE:TEST', 'Ovo je verbose');
    expect(debugEntry).toBeNull();
    expect(verboseEntry).toBeNull();

    // INFO, WARN i ERROR prolaze
    const infoEntry = logger.info('CORE:TEST', 'Informacija');
    const warnEntry = logger.warn('CORE:TEST', 'Upozorenje');
    const errorEntry = logger.error('CORE:TEST', 'Kritična greška', new Error('Bum'));

    expect(infoEntry).not.toBeNull();
    expect(infoEntry?.level).toBe('INFO');
    expect(warnEntry?.level).toBe('WARN');
    expect(errorEntry?.level).toBe('ERROR');
    expect(errorEntry?.error?.message).toBe('Bum');

    expect(logger.getHistory().length).toBe(3);
  });

  it('omogućuje dinamičku promjenu razine logiranja', () => {
    const logger = new CoreLogger('WARN', 10);
    expect(logger.info('TEST', 'Neće proći')).toBeNull();

    logger.setLevel('VERBOSE');
    const verboseEntry = logger.verbose('TEST', 'Sada prolazi');
    expect(verboseEntry).not.toBeNull();
    expect(verboseEntry?.level).toBe('VERBOSE');
  });

  it('ScopedLogger automatski postavlja kontekst', () => {
    const logger = new CoreLogger('DEBUG', 10);
    const pdfLog = logger.scope('PDF:ENGINE');

    const entry = pdfLog.info('PDF generiran u 45ms', { size: 12345 });
    expect(entry).not.toBeNull();
    expect(entry?.context).toBe('PDF:ENGINE');
    expect(entry?.message).toBe('PDF generiran u 45ms');
  });

  it('automatski sanitizira i maskira osjetljive podatke', () => {
    const logger = new CoreLogger('INFO', 10);
    const entry = logger.info('AUTH:TEST', 'Korisnički login', {
      user: 'matija',
      password: 'superSecret123',
      privateKey: 'MIICXAIBAAKCAQEA0',
      nested: {
        authToken: 'xyz-999',
        safeData: 'visible',
      },
    });

    const data = entry?.data as Record<string, any>;
    expect(data.user).toBe('matija');
    expect(data.password).toBe('***REDACTED***');
    expect(data.privateKey).toBe('***REDACTED***');
    expect(data.nested.authToken).toBe('***REDACTED***');
    expect(data.nested.safeData).toBe('visible');
  });

  it('obavještava pretplatnike (listeners) i podržava odjavu', () => {
    const logger = new CoreLogger('DEBUG', 10);
    const listenerMock = vi.fn();

    const unsubscribe = logger.subscribe(listenerMock);
    logger.info('TEST', 'Prva poruka');
    expect(listenerMock).toHaveBeenCalledTimes(1);

    unsubscribe();
    logger.info('TEST', 'Druga poruka nakon odjave');
    expect(listenerMock).toHaveBeenCalledTimes(1); // Nije pozvan drugi put
  });
});
