
import { Timestamp } from 'firebase/firestore';

/**
 * @fileOverview Date normalization utilities.
 * This file provides a centralized function to safely convert various timestamp
 * formats into a standard JavaScript Date object.
 */

/**
 * Safely converts various timestamp formats into a JavaScript Date object.
 * It handles Firestore Timestamps, JavaScript Dates, numbers (milliseconds),
 * and date strings.
 * @param timestamp - The timestamp value to normalize.
 * @returns A valid Date object or null if the input is invalid.
 */
export function normalizeTimestamp(timestamp: any): Date | null {
  try {
    if (timestamp === null || timestamp === undefined) return null;

    // Firestore Timestamp (server-side)
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate();
    }
    
    // Firestore Timestamp (client-side, after JSON serialization)
    if (typeof timestamp === 'object' && 'seconds' in timestamp && 'nanoseconds' in timestamp) {
      return new Date(timestamp.seconds * 1000);
    }

    // Already a Date object
    if (timestamp instanceof Date) {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return null;
      return date;
    }

    // Number (milliseconds)
    if (typeof timestamp === 'number') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return null;
      return date;
    }

    // String (ISO or other parseable format)
    if (typeof timestamp === 'string') {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return null;
      return date;
    }
    
    console.warn("normalizeTimestamp: unsupported value", timestamp);
    return null;

  } catch (err) {
    console.error('normalizeTimestamp error:', err, 'with input:', timestamp);
    return null;
  }
}
