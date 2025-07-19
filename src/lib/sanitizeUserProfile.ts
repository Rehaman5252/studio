
import { Timestamp } from "firebase/firestore";

/**
 * Recursively sanitizes an object by removing properties with `undefined` values
 * and converting any valid date strings or Date objects into Firestore Timestamps.
 * @param obj The object to sanitize.
 * @returns A new, sanitized object.
 */
export function sanitizeUserProfile(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  const copy: { [key: string]: any } = { ...data };

  for (const key in copy) {
    if (copy[key] === undefined) {
      delete copy[key];
      continue;
    }
    
    // Specifically handle the 'dob' field for date conversion
    if (key === 'dob' && copy[key]) {
      let date: Date | null = null;
      if (copy[key] instanceof Date) {
        date = copy[key];
      } else if (typeof copy[key] === 'string') {
        const parsedDate = new Date(copy[key]);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      } else if (copy[key] instanceof Timestamp) {
        // It's already a Timestamp, so no change needed.
        continue;
      }
      
      if (date) {
        copy[key] = Timestamp.fromDate(date);
      } else {
        // If it's an invalid date representation, remove it
        delete copy[key];
      }
      continue; // Move to the next key
    }

    // Recurse for nested objects, but not for Timestamps or other complex objects
    if (typeof copy[key] === 'object' && !(copy[key] instanceof Timestamp) && !Array.isArray(copy[key])) {
        copy[key] = sanitizeUserProfile(copy[key]);
    } else if (Array.isArray(copy[key])) {
        copy[key] = copy[key].map(item => sanitizeUserProfile(item));
    }
  }

  return copy;
}
