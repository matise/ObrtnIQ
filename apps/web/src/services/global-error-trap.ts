import type { LogEntry } from '@obrtniq/core';
import { appLogger } from './logger';

const STORAGE_KEY_AUTO_OPEN = 'obrtniq_auto_open_log_on_error';

type AutoOpenListener = (errorEntry: LogEntry) => void;
const autoOpenListeners: Set<AutoOpenListener> = new Set();

let isInitialized = false;

/**
 * Dohvaća korisničku preferenciju za automatsko otvaranje dnevnika grešaka (zadano: true)
 */
export function getAutoOpenOnError(): boolean {
  if (typeof localStorage === 'undefined') return true;
  try {
    const val = localStorage.getItem(STORAGE_KEY_AUTO_OPEN);
    if (val === null) return true; // zadano uključeno
    return val === 'true';
  } catch {
    return true;
  }
}

/**
 * Sprema korisničku preferenciju za automatsko otvaranje dnevnika grešaka
 */
export function setAutoOpenOnError(enabled: boolean): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_AUTO_OPEN, String(enabled));
  } catch {
    // ignoriraj
  }
}

/**
 * Registrira slušatelja za automatsko otvaranje dnevnika grešaka
 */
export function onAutoOpenTriggered(listener: AutoOpenListener): () => void {
  autoOpenListeners.add(listener);
  return () => {
    autoOpenListeners.delete(listener);
  };
}

/**
 * Ručno ili automatski pokreće signal za otvaranje dnevnika
 */
export function triggerAutoOpen(errorEntry: LogEntry): void {
  autoOpenListeners.forEach((listener) => {
    try {
      listener(errorEntry);
    } catch (err) {
      console.error('Greška u auto-open listeneru:', err);
    }
  });
}

/**
 * Inicijalizira globalne hvatače neuhvaćenih grešaka u pregledniku
 */
export function initGlobalErrorTrap(): void {
  if (isInitialized || typeof window === 'undefined') return;
  isInitialized = true;

  // 1. Neuhvaćene sinkrone JavaScript iznimke
  window.addEventListener('error', (event) => {
    // Ignoriraj greške iz vanjskih browser ekstenzija ako nemaju source
    const message = event.message || 'Neuhvaćena JavaScript pogreška';
    const err = event.error || new Error(message);

    appLogger.scope('GLOBAL:UNCAUGHT').error(message, err, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // 2. Neobrađeni asinkroni Promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const err = reason instanceof Error ? reason : new Error(String(reason || 'Neobrađeno odbijanje Promise-a'));
    const message = err.message || 'Neobrađeno asinkrono odbijanje Promise-a';

    appLogger.scope('GLOBAL:PROMISE').error(message, err);
  });

  // 3. Spajanje na appLogger za automatsko otvaranje kod bilo koje ERROR razine
  appLogger.subscribe((entry) => {
    if (entry.level === 'ERROR' && getAutoOpenOnError()) {
      triggerAutoOpen(entry);
    }
  });
}
