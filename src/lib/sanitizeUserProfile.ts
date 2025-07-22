
import { Timestamp } from "firebase/firestore";

/**
 * @fileOverview User Profile Sanitizer
 *
 * This utility function sanitizes objects before they are sent to Firestore.
 * It performs two key operations:
 * 1.  Removes any properties with `undefined` values, as Firestore cannot store them.
 * 2.  Converts any valid JavaScript `Date` objects or date strings (specifically
 *     in 'YYYY-MM-DD' format for the 'dob' field) into Firestore `Timestamp` objects.
 *
 * This ensures data consistency and prevents Firestore write errors.
 */

export function sanitizeUserProfile(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  // Handle arrays by mapping over them and sanitizing each item.
  if (Array.isArray(data)) {
    return data.map(item => sanitizeUserProfile(item)).filter(item => item !== undefined);
  }

  const sanitizedObject: { [key: string]: any } = {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      const value = data[key];

      if (key === 'dob' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          sanitizedObject[key] = Timestamp.fromDate(date);
        }
      } else if (value instanceof Date) {
        sanitizedObject[key] = Timestamp.fromDate(value);
      } else if (value instanceof Timestamp) {
        sanitizedObject[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        sanitizedObject[key] = sanitizeUserProfile(value);
      } else {
        sanitizedObject[key] = value;
      }
    }
  }

  return sanitizedObject;
}
