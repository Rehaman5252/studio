/**
 * @fileoverview Lightweight structured logger for both server and client.
 *
 * This utility provides a simple, structured logging interface that can be used
 * across both client and server components. It abstracts the native `console`
 * methods and ensures debug logs are only shown in non-production environments.
 */

export const logger = {
  info: (message: string, meta?: unknown) => {
    console.log(`[INFO] ${message}`, meta ?? '');
  },
  warn: (message: string, meta?: unknown) => {
    console.warn(`[WARN] ${message}`, meta ?? '');
  },
  error: (message: string, meta?: unknown) => {
    console.error(`[ERROR] ${message}`, meta ?? '');
  },
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] ${message}`, meta ?? '');
    }
  },
};
