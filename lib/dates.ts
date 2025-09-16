// lib/dates.ts

import { Timestamp } from "firebase/firestore";

/**
 * Normalize Firestore or JS timestamps into a Date object.
 * Supports Firestore Timestamp, string, number, and Date inputs.
 */
export function normalizeTimestamp(input: any): Date | null {
  try {
    if (!input) return null;

    // Firestore Timestamp (has toDate method)
    if (typeof input.toDate === 'function') {
      return input.toDate();
    }

    // Firestore timestamp object (seconds + nanoseconds)
    if (typeof input === 'object' && 'seconds' in input && 'nanoseconds' in input) {
      return new Date(input.seconds * 1000);
    }

    // Already a Date
    if (input instanceof Date) {
      return input;
    }

    // Milliseconds (number)
    if (typeof input === 'number') {
      return new Date(input);
    }

    // ISO string (string)
    if (typeof input === 'string') {
      return new Date(input);
    }

    return null;
  } catch (err) {
    console.error('normalizeTimestamp error:', err);
    return null;
  }
}
