/**
 * @fileoverview Centralized schema for analytics events.
 *
 * This file defines a single source of truth for all analytics events,
 * ensuring that event names and their payloads are consistent, documented,
 * and type-safe across the application.
 */

import type { z } from 'zod';

// Define the payload schema for each event
const quizEvents = {
  quiz_start: z.object({
    format: z.string(),
    brand: z.string(),
    source: z.enum(['ai', 'fallback']),
  }),
  quiz_complete: z.object({
    format: z.string(),
    brand: z.string(),
    source: z.enum(['ai', 'fallback']),
    score: z.number(),
    totalQuestions: z.number(),
    disqualified: z.boolean(),
    reason: z.string().optional().nullable(),
  }),
  quiz_fail_load: z.object({
    error: z.string(),
  }),
  quiz_fetch_retry: z.object({
    brand: z.string(),
    format: z.string(),
  }),
};

// Union type of all possible event names
export type EventName = keyof typeof quizEvents;

// A generic type to get the payload for a given event name
export type EventPayload<T extends EventName> = z.infer<typeof quizEvents[T]>;

// Export the schema for use in the logger
export const eventSchema = quizEvents;
