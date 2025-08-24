
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

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
export function mapFirestoreError(error: any): { title: string; message: string } {
    const code = (error as any)?.code ?? "unknown";
    const message = (error as any)?.message;
  
    switch (code) {
      case "unavailable":
        return {
          title: "Connection Error",
          message: "Bad connection has stopped play. Please check your network and try again.",
        };
      case "failed-precondition":
        return {
          title: "Leaderboard Unavailable",
          message: "The leaderboard is being prepared. Please check back in a moment.",
        };
      case "permission-denied":
        return {
          title: "Permission Denied",
          message: "You don’t have the required permissions to view this leaderboard.",
        };
      case "unauthenticated":
        return {
          title: "Authentication Required",
          message: "You need to be logged in to view this leaderboard. Please sign in.",
        };
      case "deadline-exceeded":
        return {
          title: "Request Timeout",
          message: "The leaderboard request took too long. Please retry.",
        };
      case "resource-exhausted":
        return {
          title: "Rate Limited",
          message: "Too many requests at once. Please wait a moment and try again.",
        };
      case "cancelled":
        return {
          title: "Request Cancelled",
          message: "The request was cancelled. Please try again.",
        };
      case "not-found":
        return {
          title: "Data Not Found",
          message: "Leaderboard data could not be found. It may not exist yet or was removed.",
        };
      default:
        return {
          title: "Error Loading Data",
          message: message || "A technical fault has interrupted play. We're working to get it fixed.",
        };
    }
  }
