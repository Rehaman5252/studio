
import { Timestamp } from "firebase/firestore";

/**
 * Recursively sanitizes an object by removing properties with `undefined` values
 * and converting any valid date strings or Date objects into Firestore Timestamps.
 * @param data The object to sanitize.
 * @returns A new, sanitized object.
 */
export function sanitizeUserProfile(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  const copy: { [key: string]: any } = Array.isArray(data) ? [] : {};

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
      const value = data[key];
      if (value instanceof Date) {
        copy[key] = Timestamp.fromDate(value);
      } else if (key === 'dob' && typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          copy[key] = Timestamp.fromDate(date);
        }
      } else if (value instanceof Timestamp) {
        copy[key] = value;
      } else if (typeof value === 'object' && value !== null) {
        copy[key] = sanitizeUserProfile(value);
      } else {
        copy[key] = value;
      }
    }
  }

  return copy;
}
