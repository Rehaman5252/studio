
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FirebaseError } from 'firebase/app';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a number to have a leading zero if it's less than 10.
 * @param time The number to format.
 * @returns A string representation of the number, padded with a zero if needed.
 */
export function formatTime(time: number): string {
  return time.toString().padStart(2, '0');
}

/**
 * Generates a unique ID for the current 10-minute quiz slot.
 * @returns A string representing the start timestamp of the current slot.
 */
export const getQuizSlotId = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const slotLength = 10; // 10 minutes per slot
  const currentSlotStartMinute = Math.floor(minutes / slotLength) * slotLength;
  
  const slotTime = new Date(now);
  slotTime.setMinutes(currentSlotStartMinute, 0, 0); // Set to the beginning of the slot
  
  return slotTime.getTime().toString();
};


/**
 * Masks a phone number, showing only the first and last two digits.
 * @param phone The phone number string to mask.
 * @returns The masked phone number or an empty string if input is invalid.
 */
export function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 6) return '';
  return `${phone.substring(0, 2)}******${phone.substring(phone.length - 2)}`;
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
 * Maps Firestore and other errors to user-friendly messages.
 * @param error The error object.
 * @returns An object with a user-friendly message and an optional error code.
 */
export function mapFirestoreError(error: any): { code?: string; userMessage: string; technical?: string } {
    if (!error) return { userMessage: "An unknown error occurred." };

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return { code: "OFFLINE", userMessage: "You appear to be offline. Please check your internet connection." };
    }
    
    const code = error.code || error?.name || "";
    const msg = String(error.message || error).toLowerCase();

    // Specific check for Firestore index errors
    if (/index|failed-precondition/i.test(msg) && (msg.includes('query requires an index') || msg.includes('index is required'))) {
        return {
          code: "INDEX_REQUIRED",
          userMessage: "The leaderboard database is being indexed. This can take a few minutes. Please check back shortly.",
          technical: msg
        };
    }

    if (error instanceof FirebaseError) {
        switch (error.code) {
            case 'unavailable':
                return { code: error.code, userMessage: 'The server is temporarily unavailable. Please try again in a moment.' };
            case 'permission-denied':
                return { code: error.code, userMessage: 'You do not have permission to access this resource.' };
            case 'not-found':
                return { code: error.code, userMessage: 'The requested resource was not found.' };
            case 'deadline-exceeded':
                return { code: error.code, userMessage: 'The request timed out. Please check your connection and try again.' };
            case 'cancelled':
                return { code: error.code, userMessage: 'The request was cancelled. Please try again.' };
           case "unauthenticated":
              return { code: error.code, userMessage: "Your session may have expired. Please log in again." };
          case "resource-exhausted":
              return { code: error.code, userMessage: "The request limit was reached. Please wait before trying again." };
          default:
              return { code: error.code, userMessage: `An unexpected server error occurred (${error.code}). Please try again.` };
        }
    }

    if (msg.includes('network') || msg.includes('failed to fetch')) {
        return { code: "NETWORK_ERROR", userMessage: "A network error occurred. Please check your connection and try again." };
    }
  
    if (typeof error.message === 'string') {
        return { code: code || "UNKNOWN", userMessage: error.message };
    }

    return { code: "UNKNOWN", userMessage: 'An unknown error occurred. Please try again.' };
}
