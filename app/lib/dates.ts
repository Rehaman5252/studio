
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
    if (timestamp === null || timestamp === undefined) return null;
    
    try {
        let date: Date;

        if (timestamp instanceof Date) {
            date = timestamp;
        } else if (timestamp instanceof Timestamp) { // Firestore Timestamp from server
            date = timestamp.toDate();
        } else if (typeof timestamp === 'object' && 'seconds' in timestamp && typeof timestamp.seconds === 'number' && 'nanoseconds' in timestamp && typeof timestamp.nanoseconds === 'number') {
            // Firestore Timestamp from client (after JSON serialization)
            date = new Timestamp(timestamp.seconds, timestamp.nanoseconds).toDate();
        } else if (typeof timestamp === 'number') { // Unix timestamp in ms
            date = new Date(timestamp);
        } else if (typeof timestamp === 'string') {
            date = new Date(timestamp);
        } else {
            if (process.env.NODE_ENV === 'development') {
                console.warn("normalizeTimestamp: unsupported value", timestamp);
            }
            return null;
        }

        if (isNaN(date.getTime())) {
            if (process.env.NODE_ENV === 'development') {
                console.warn("normalizeTimestamp: created an invalid date from", timestamp);
            }
            return null;
        };

        return date;
    } catch (error) {
        if (process.env.NODE_ENV === 'development') {
            console.error("normalizeTimestamp: caught an error", error);
        }
        return null;
    }
};
