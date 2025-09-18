/**
 * @fileoverview Centralized logger for consistent, environment-aware logging.
 *
 * This utility provides a simple, structured logging interface that can be used
 * across both client and server components. It abstracts the native `console`
 * methods and ensures debug logs are only shown in non-production environments.
 */

import { eventSchema, type EventName, type EventPayload } from './analytics-events';

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
  /**
   * Logs a structured analytics event.
   * In a production environment, this could be extended to send data to an analytics service.
   * It validates the event against a Zod schema to ensure correctness.
   */
  event: <T extends EventName>(name: T, payload: EventPayload<T>) => {
    const validation = eventSchema[name].safeParse(payload);
    if (!validation.success) {
      if (process.env.NODE_ENV !== 'production') {
          console.error(`[EVENT VALIDATION FAILED] for event "${name}":`, validation.error.flatten());
      }
      return;
    }
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[EVENT] ${name}`, payload);
    }
    // In a real production scenario, you would add your analytics provider call here.
    // e.g., analytics.track(name, payload);
  },
};
