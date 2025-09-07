
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { FirebaseError } from 'firebase/app';


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: number): string {
  return time.toString().padStart(2, '0');
}

export const getQuizSlotId = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const slotLength = 10;
  const currentSlotStartMinute = Math.floor(minutes / slotLength) * slotLength;
  
  const slotTime = new Date(now);
  slotTime.setMinutes(currentSlotStartMinute, 0, 0); 
  
  return slotTime.getTime().toString();
};

export function maskPhone(phone?: string | null): string {
  if (!phone || phone.length < 6) return '';
  return `${phone.substring(0, 2)}******${phone.substring(phone.length - 2)}`;
}

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

export function mapFirestoreError(error: any): string {
  if (!error) return "An unknown error occurred.";

  if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return "You appear to be offline. Please check your internet connection.";
  }

  const code = error.code || '';
  const message = (error.message || '').toLowerCase();
  
  if (code === 'failed-precondition' && message.includes('index')) {
    return "needs_index";
  }

  if (error instanceof FirebaseError) {
      switch (error.code) {
          case 'unavailable':
              return 'The server is temporarily unavailable. Please try again in a moment.';
          case 'permission-denied':
              return 'You do not have permission to access this resource.';
          case 'not-found':
              return 'The requested resource was not found.';
          case 'deadline-exceeded':
              return 'The request timed out. Please check your connection and try again.';
          case 'cancelled':
              return 'The request was cancelled. Please try again.';
           case "unauthenticated":
              return "Your session may have expired. Please log in again.";
          case "resource-exhausted":
              return "The request limit was reached. Please wait before trying again.";
          default:
              return `An unexpected server error occurred (${error.code}). Please try again.`;
      }
  }

  if (message.includes('network') || message.includes('failed to fetch')) {
    return "A network error occurred. Please check your connection and try again.";
  }
  
  if (typeof error.message === 'string') {
    return error.message;
  }

  return 'An unknown error occurred. Please try again.';
}
