/**
 * ObrtnIQ Core Logging System - Tipovi i Sučelja
 */

export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'VERBOSE';

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
  VERBOSE: 4,
};

export interface LogEntryError {
  name: string;
  message: string;
  stack?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;     // ISO 8601 string ("2026-10-24T15:30:12.450Z")
  displayTime: string;   // Kratko lokalno vrijeme ("15:30:12.450")
  level: LogLevel;
  context: string;       // Oznaka modula (npr. "CORE:OIB", "STORAGE:DEXIE", "PDF:ENGINE")
  message: string;
  data?: unknown;
  error?: LogEntryError;
}

export type LogListener = (entry: LogEntry) => void;

export interface IScopedLogger {
  readonly context: string;
  error(message: string, error?: unknown, data?: unknown): LogEntry | null;
  warn(message: string, data?: unknown): LogEntry | null;
  info(message: string, data?: unknown): LogEntry | null;
  debug(message: string, data?: unknown): LogEntry | null;
  verbose(message: string, data?: unknown): LogEntry | null;
}

export interface ILogger {
  level: LogLevel;
  setLevel(level: LogLevel): void;
  isLevelEnabled(level: LogLevel): boolean;
  subscribe(listener: LogListener): () => void;
  scope(context: string): IScopedLogger;
  log(level: LogLevel, context: string, message: string, data?: unknown, error?: unknown): LogEntry | null;
  error(context: string, message: string, error?: unknown, data?: unknown): LogEntry | null;
  warn(context: string, message: string, data?: unknown): LogEntry | null;
  info(context: string, message: string, data?: unknown): LogEntry | null;
  debug(context: string, message: string, data?: unknown): LogEntry | null;
  verbose(context: string, message: string, data?: unknown): LogEntry | null;
  getHistory(): LogEntry[];
  clear(): void;
}
