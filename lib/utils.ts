
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
 * Maps Firestore error codes to user-friendly messages.
 * @param error The error object from Firestore.
 * @returns An object with a title and message for display in an Alert.
 */
export function mapFirestoreError(e: unknown): string {
    // Handle browser network errors
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return "You appear to be offline. Please check your internet connection.";
    }

    if (e instanceof FirebaseError) {
        switch (e.code) {
        case 'unavailable':
            return '⚠️ The server is temporarily unavailable. Please try again in a moment.';
        case 'permission-denied':
            return '🚫 You do not have permission to access this resource.';
        case 'not-found':
            return '❌ The requested resource was not found.';
        case 'deadline-exceeded':
            return 'The request timed out. Please check your connection and try again.';
        case 'cancelled':
            return 'The request was cancelled. Please try again.';
        default:
            return `A server error occurred (${e.code}). Please try again later.`;
        }
    }
    
    if (e instanceof Error) {
        // Handle generic fetch/network errors
        if (e.message.includes('Failed to fetch') || e.message.includes('network request failed')) {
            return "A network error occurred. Please check your connection and try again.";
        }
        return e.message;
    }

    return 'An unknown error occurred. Please try again.';
}
