
/**
 * @fileoverview Lightweight structured logger for both server and client.
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
  event: <T extends EventName>(eventName: T, payload: EventPayload<T>) => {
    try {
      // Validate the payload against the schema for that event
      eventSchema[eventName].parse(payload);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[EVENT] ${eventName}`, payload);
      }
      // In a real app, you would send this to your analytics service
      // e.g., analytics.track(eventName, payload);
    } catch (e: any) {
       console.error(`[EVENT VALIDATION FAILED] for event "${eventName}":`, e.flatten());
    }
  },
};
