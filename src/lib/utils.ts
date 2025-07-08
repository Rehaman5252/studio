
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(time: number): string {
  return time.toString().padStart(2, '0');
}

/**
 * Generates a unique ID for the current 10-minute quiz slot.
 * @returns A string representing the start time of the current slot.
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
 * Captures an HTML element and prompts the user to print it, which can be saved as a PDF.
 * @param elementId The ID of the HTML element to capture.
 */
export const printCertificate = (elementId: string) => {
  const input = document.getElementById(elementId);
  if (!input) {
    console.error("Certificate element not found!");
    alert("Could not find certificate element to print.");
    return;
  }
  
  // This is a simplified approach using the browser's print functionality.
  // It's much lighter than using external libraries.
  const content = input.innerHTML;
  const originalContent = document.body.innerHTML;
  
  document.body.innerHTML = content;
  window.print();
  document.body.innerHTML = originalContent;
  window.location.reload(); // Reload to restore event listeners and scripts.
};
