/**
 * @fileoverview Centralized logger utility.
 * Provides consistent, structured, and environment-aware logging with type-safe
 * event validation using Zod.
 */

import { eventSchema, EventName, EventPayload } from './analytics-events';
import { fromZodError } from 'zod-validation-error';

const isDev = process.env.NODE_ENV !== 'production';

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'log';

function log(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  // In a real-world scenario, this would forward to a logging service (e.g., Datadog, Sentry, Cloud Logging)
  if (isDev) {
    const timestamp = new Date().toISOString();
    const output = { timestamp, level, message, ...(meta || {}) };

    switch (level) {
      case 'info':
        console.info(`[INFO] ${timestamp}: ${message}`, meta || '');
        break;
      case 'warn':
        console.warn(`[WARN] ${timestamp}: ${message}`, meta || '');
        break;
      case 'error':
        console.error(`[ERROR] ${timestamp}: ${message}`, meta || '');
        break;
      default:
        console.log(`[${level.toUpperCase()}] ${timestamp}: ${message}`, meta || '');
        break;
    }
  } else {
    // In production, log clean JSON to be ingested by a logging service.
    console.log(JSON.stringify({
      level,
      message,
      ...(meta || {}),
    }));
  }
}

function event<T extends EventName>(eventName: T, payload: EventPayload<T>) {
  const schema = eventSchema[eventName];
  const validation = schema.safeParse(payload);

  if (!validation.success) {
    const validationError = fromZodError(validation.error);
    log('error', `[EVENT VALIDATION FAILED] for event "${eventName}":`, {
        error: validationError.message,
        details: validationError.details,
    });
    // In a production system, you might want to stop here or log to a specific 'invalid_events' stream.
    if (!isDev) {
        // Still log the invalid event in production for auditing, but mark it as invalid.
        log('error', '[INVALID_EVENT]', { event: eventName, payload, error: validationError.details });
    }
    return;
  }
  
  // In a real app, this would send to an analytics service (e.g., Mixpanel, GA, Segment).
  log('log', `[EVENT] ${eventName}`, payload);
}

export const logger = {
  info: (message: string, meta?: Record<string, unknown>) => log('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => log('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => log('error', message, meta),
  debug: (message: string, meta?: Record<string, unknown>) => log('debug', message, meta),
  event,
};
