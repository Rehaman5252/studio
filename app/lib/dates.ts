
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
    if (!timestamp) return null;
    
    // Firestore Timestamp
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate();
    }
    
    // Already a JavaScript Date
    if (timestamp instanceof Date) {
        return timestamp;
    }
    
    // Number (milliseconds) or String
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) {
        return date;
    }
    
    return null;
};
