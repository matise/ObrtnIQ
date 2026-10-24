import { 
  LogLevel, 
  LogEntry, 
  LogListener, 
  ILogger, 
  IScopedLogger, 
  LOG_LEVEL_PRIORITY,
  LogEntryError 
} from './types';
import { RingBuffer } from './ring-buffer';
import { parseStackTrace } from './stack-parser';

/**
 * Pomoćna funkcija za sigurno sanitiziranje osjetljivih podataka
 */
function sanitizeData(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeData(item));
  }

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('privatekey') ||
      lowerKey.includes('auth') ||
      lowerKey.includes('token')
    ) {
      result[key] = '***REDACTED***';
    } else {
      result[key] = sanitizeData(value);
    }
  }
  return result;
}

/**
 * Pomoćna funkcija za ekstrahiranje greške i strukturiranih stack okvira
 */
function parseError(err: unknown): LogEntryError | undefined {
  if (!err) return undefined;
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      frames: parseStackTrace(err.stack),
    };
  }
  if (typeof err === 'string') {
    return {
      name: 'Error',
      message: err,
      frames: parseStackTrace(err),
    };
  }
  return {
    name: 'UnknownError',
    message: String(err),
  };
}

/**
 * Scoped Logger implementacija za pojedini modul/kontekst
 */
class ScopedLogger implements IScopedLogger {
  readonly context: string;
  private logger: CoreLogger;

  constructor(context: string, logger: CoreLogger) {
    this.context = context;
    this.logger = logger;
  }

  error(message: string, error?: unknown, data?: unknown): LogEntry | null {
    return this.logger.error(this.context, message, error, data);
  }

  warn(message: string, data?: unknown): LogEntry | null {
    return this.logger.warn(this.context, message, data);
  }

  info(message: string, data?: unknown): LogEntry | null {
    return this.logger.info(this.context, message, data);
  }

  debug(message: string, data?: unknown): LogEntry | null {
    return this.logger.debug(this.context, message, data);
  }

  verbose(message: string, data?: unknown): LogEntry | null {
    return this.logger.verbose(this.context, message, data);
  }
}

/**
 * Glavni Core Logger sustav
 */
export class CoreLogger implements ILogger {
  level: LogLevel;
  private ringBuffer: RingBuffer<LogEntry>;
  private listeners: Set<LogListener> = new Set();
  private scopedLoggers: Map<string, IScopedLogger> = new Map();
  private idCounter: number = 0;

  constructor(defaultLevel: LogLevel = 'INFO', bufferCapacity: number = 500) {
    this.level = defaultLevel;
    this.ringBuffer = new RingBuffer<LogEntry>(bufferCapacity);
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  isLevelEnabled(level: LogLevel): boolean {
    return LOG_LEVEL_PRIORITY[level] <= LOG_LEVEL_PRIORITY[this.level];
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  scope(context: string): IScopedLogger {
    const existing = this.scopedLoggers.get(context);
    if (existing) return existing;

    const scoped = new ScopedLogger(context, this);
    this.scopedLoggers.set(context, scoped);
    return scoped;
  }

  log(
    level: LogLevel, 
    context: string, 
    message: string, 
    data?: unknown, 
    error?: unknown
  ): LogEntry | null {
    if (!this.isLevelEnabled(level)) {
      return null;
    }

    const now = new Date();
    const isoString = now.toISOString();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const millis = String(now.getMilliseconds()).padStart(3, '0');
    const displayTime = `${hours}:${minutes}:${seconds}.${millis}`;

    this.idCounter++;
    const id = `log_${now.getTime()}_${this.idCounter}`;

    const entry: LogEntry = {
      id,
      timestamp: isoString,
      displayTime,
      level,
      context,
      message,
      data: sanitizeData(data),
      error: parseError(error),
    };

    // Spremi u cirkularni memorijski spremnik
    this.ringBuffer.push(entry);

    // Obavijesti pretplatnike
    this.listeners.forEach((listener) => {
      try {
        listener(entry);
      } catch (err) {
        console.error('Greška u listeneru logera:', err);
      }
    });

    return entry;
  }

  error(context: string, message: string, error?: unknown, data?: unknown): LogEntry | null {
    return this.log('ERROR', context, message, data, error);
  }

  warn(context: string, message: string, data?: unknown): LogEntry | null {
    return this.log('WARN', context, message, data);
  }

  info(context: string, message: string, data?: unknown): LogEntry | null {
    return this.log('INFO', context, message, data);
  }

  debug(context: string, message: string, data?: unknown): LogEntry | null {
    return this.log('DEBUG', context, message, data);
  }

  verbose(context: string, message: string, data?: unknown): LogEntry | null {
    return this.log('VERBOSE', context, message, data);
  }

  getHistory(): LogEntry[] {
    return this.ringBuffer.toArray();
  }

  clear(): void {
    this.ringBuffer.clear();
  }
}

/**
 * Globalni singleton logger za domenske pakete
 */
export const coreLogger = new CoreLogger('INFO', 500);
