// src/lib/auth/getAuthenticatedUser.ts
import { cookies } from 'next/headers';
import { adminAuth } from '../firebaseAdmin';
import { getFirebaseFirestore } from '../firebaseClient';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import type { DecodedIdToken } from 'firebase-admin/auth';

interface AuthenticatedUser {
    user: DecodedIdToken | null;
    profile: Record<string, any> | null;
}

/**
 * A server-side utility to get the currently authenticated user's
 * session and profile data.
 * @returns {Promise<AuthenticatedUser>} An object containing the user's decoded token and their Firestore profile.
 */
export async function getAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = cookies().get('session')?.value || '';

  if (!session) {
    return { user: null, profile: null };
  }

  try {
    const decodedIdToken = await adminAuth.verifySessionCookie(session, true);
    
    // We get a new firestore instance here to ensure it works server-side.
    const db = getFirebaseFirestore();
    if (!db) {
        throw new Error("Firestore is not initialized on the server");
    }

    const userDocRef = doc(db, "users", decodedIdToken.uid);
    const userDoc = await getDoc(userDocRef);

    let profileData = null;
    if (userDoc.exists()) {
        profileData = userDoc.data();
        // Convert Firestore Timestamps to serializable format (e.g., ISO string for dates)
        Object.keys(profileData).forEach(key => {
            if (profileData[key] instanceof Timestamp) {
                profileData[key] = profileData[key].toDate().toISOString();
            }
        });
        if(profileData.dob) {
            profileData.dob = profileData.dob.split('T')[0];
        }
    }

    return { user: decodedIdToken, profile: profileData };
  } catch (error) {
    console.error('Session verification failed:', error);
    // In case of an invalid session cookie, it's best to treat the user as logged out.
    return { user: null, profile: null };
  }
}
