
import { Timestamp } from "firebase/firestore";

const MANDATORY_PROFILE_FIELDS = [
    'name', 'email', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
] as const;

type ProfileField = typeof MANDATORY_PROFILE_FIELDS[number];

const isFieldFilled = (fieldName: ProfileField, value: any): boolean => {
    if (value === undefined || value === null) return false;
    
    switch(fieldName) {
        case 'name':
        case 'occupation':
        case 'favoriteCricketer':
            return typeof value === 'string' && value.trim().length >= 3;
        case 'email':
            return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
        case 'phone':
             return typeof value === 'string' && /^\d{10,}$/.test(value.trim());
        case 'upi':
            return typeof value === 'string' && /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
        case 'dob':
            return (value instanceof Timestamp && !isNaN(value.toDate().getTime())) || (typeof value === 'string' && !isNaN(new Date(value).getTime()));
        case 'gender':
        case 'favoriteFormat':
        case 'favoriteTeam':
             return typeof value === 'string' && value.trim().length > 0;
        default:
            return !!value;
    }
}

/**
 * Checks if a user profile object has all mandatory fields filled out correctly.
 * @param profile - The user profile object.
 * @returns `true` if the profile is complete, `false` otherwise.
 */
export function isProfileConsideredComplete(profile: any | null): boolean {
    if (!profile) return false;
    return MANDATORY_PROFILE_FIELDS.every(field => isFieldFilled(field, profile[field]));
}
