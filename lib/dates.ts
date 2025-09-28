
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


/**
 * Calculates age based on a date of birth string (YYYY-MM-DD).
 * @param dobString The date of birth in 'YYYY-MM-DD' format.
 * @returns The calculated age as a number, or null if the input is invalid.
 */
export function calculateAge(dobString: string): number | null {
  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Masks a phone number, showing only the first and last two digits.
 * @param phone The phone number string to mask.
 * @returns The masked phone number or an empty string if input is invalid.
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 6) return '';
  return `${phone.substring(0, 2)}******${phone.substring(phone.length - 2)}`;
}
