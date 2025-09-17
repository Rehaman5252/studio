
/**
 * @fileoverview A simple, centralized logging utility.
 *
 * This module provides a basic logging interface that can be expanded later
 * to integrate with a real telemetry service like Sentry, LogRocket, or Firebase Analytics.
 * For now, it just wraps the standard console methods and only logs in non-production environments.
 */

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
};
