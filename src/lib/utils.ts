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

export function maskPhone(phone?: string) {
    if (!phone || phone.length < 10) return 'Not set';
    const lastFour = phone.slice(-4);
    return `+91 •••• ••${lastFour.substring(0,2)} ${lastFour.substring(2,4)}`;
}

export function maskUpi(upi?: string) {
    if (!upi || !upi.includes('@')) return 'Not set';
    const [user, domain] = upi.split('@');
    if (user.length <= 3) return `${user}••••@${domain}`;
    return `${user.substring(0, 3)}••••@${domain}`;
}

export function calculateAge(dobString?: string): number | null {
    if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}
