/**
 * @fileoverview Centralized logger utility.
 * Provides consistent, structured, and environment-aware logging.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const output = {
    timestamp,
    level,
    message,
    ...(meta || {}),
  };

  // In production, keep logs clean & JSON-structured
  if (process.env.NODE_ENV === 'production') {
    console.log(JSON.stringify(output));
  } else {
    // In development, print readable console output
    switch (level) {
      case 'info':
        console.info(`[INFO] ${timestamp} - ${message}`, meta || '');
        break;
      case 'warn':
        console.warn(`[WARN] ${timestamp} - ${message}`, meta || '');
        break;
      case 'error':
        console.error(`[ERROR] ${timestamp} - ${message}`, meta || '');
        break;
      case 'debug':
        console.debug(`[DEBUG] ${timestamp} - ${message}`, meta || '');
        break;
      default:
        console.log(`[LOG] ${timestamp} - ${message}`, meta || '');
    }
  }
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
};
