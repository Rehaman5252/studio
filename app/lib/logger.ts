
/**
 * @fileoverview A simple, centralized logging utility.
 *
 * This module provides a basic logging interface that can be expanded later
 * to integrate with a real telemetry service like Sentry, LogRocket, or Firebase Analytics.
 * It also includes a dedicated `event` method for tracking structured analytics.
 */
import type { EventName, EventPayload } from './analytics-events';
import { eventSchema } from './analytics-events';

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

type LogLevel = 'log' | 'warn' | 'error' | 'info';

const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  // In a real-world scenario, you would send this to your logging service.
  // e.g., Sentry.captureMessage(message, { level, extra: context });

  if (!IS_PRODUCTION) {
    const timestamp = new Date().toISOString();
    console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}`, context || '');
  }
};

export const logger = {
  info: (message: string, context?: Record<string, any>) => {
    log('info', message, context);
  },
  warn: (message: string, context?: Record<string, any>) => {
    log('warn', message, context);
  },
  error: (message: string, context?: Record<string, any>) => {
    log('error', message, context);
  },
  /**
   * Tracks a structured, type-safe analytics event. It also validates the payload
   * at runtime to catch errors during development.
   * @param eventName The name of the event (e.g., 'quiz_start').
   * @param payload An object containing metadata about the event.
   */
  event: <T extends EventName>(eventName: T, payload: EventPayload<T>) => {
    // 1. Runtime validation (great for development)
    const schema = eventSchema[eventName];
    const validation = schema.safeParse(payload);
    if (!validation.success) {
      console.error(
        `[EVENT VALIDATION FAILED] for event "${eventName}":`,
        validation.error.flatten()
      );
      return;
    }

    // 2. In a real-world scenario, you would send this to your analytics service.
    // e.g., firebase.analytics().logEvent(eventName, payload);
    
    // 3. Log to console in non-production environments
    if (!IS_PRODUCTION) {
      console.log(`[EVENT] ${eventName}`, payload);
    }
  },
};
