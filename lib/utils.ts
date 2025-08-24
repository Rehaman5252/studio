
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
export function mapFirestoreError(error: any): { title: string, message: string } {
    console.error("Firestore Error:", error.code, error.message);
    switch (error.code) {
        case 'unavailable':
            return {
                title: "Connection Error",
                message: "Bad connection has stopped play. Please check your network and try again."
            };
        case 'failed-precondition':
             return {
                title: "Leaderboard Unavailable",
                message: "The leaderboard is being prepared, likely because the required indexes are being built. Please check back in a moment."
            };
        case 'permission-denied':
            return {
                title: "Permission Error",
                message: "You do not have permission to access this data. Please contact support if you believe this is an error."
            };
        default:
            return {
                title: "Error Loading Data",
                message: "A technical fault has interrupted play. We're working to get it fixed."
            };
    }
}
