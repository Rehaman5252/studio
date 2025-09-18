
/**
 * @fileoverview Centralized schema for analytics events.
 *
 * This file defines a single source of truth for all analytics events,
 * ensuring that event names and their payloads are consistent, documented,
 * and type-safe across the application.
 */

import type { z } from 'zod';
import { z as zod } from 'zod'; // Use a different name to avoid conflict with 'z' from genkit

// Define the payload schema for each event
const quizEvents = {
  quiz_start: zod.object({
    format: zod.string(),
    brand: zod.string(),
    source: zod.enum(['ai', 'fallback']),
  }),
  quiz_complete: zod.object({
    format: zod.string(),
    brand: zod.string(),
    source: zod.enum(['ai', 'fallback']),
    score: zod.number(),
    totalQuestions: zod.number(),
    disqualified: zod.boolean(),
    reason: zod.string().optional().nullable(),
  }),
  quiz_fail_load: zod.object({
    error: zod.string(),
  }),
  quiz_fetch_retry: zod.object({
    brand: zod.string(),
    format: zod.string(),
  }),
};

// Union type of all possible event names
export type EventName = keyof typeof quizEvents;

// A generic type to get the payload for a given event name
export type EventPayload<T extends EventName> = z.infer<typeof quizEvents[T]>;

// Export the schema for use in the logger
export const eventSchema = quizEvents;
