
import { getFirebaseFirestore } from '../firebaseClient';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

/**
 * A server-side utility to get the currently authenticated user's
 * session and profile data.
 * @returns {Promise<{user: DecodedIdToken | null, profile: any | null}>}
 */
export async function getAuthenticatedUser() {
  const session = cookies().get('session')?.value || '';

  if (!session) {
    return { user: null, profile: null };
  }

  try {
    const decodedIdToken = await getAuth().verifySessionCookie(session, true);
    
    const db = getFirebaseFirestore();
    if (!db) {
        // This should not happen if initialization is correct
        throw new Error("Firestore is not initialized on the server");
    }

    const userDocRef = doc(db, "users", decodedIdToken.uid);
    const userDoc = await getDoc(userDocRef);
    let profileData = null;
    if (userDoc.exists()) {
        profileData = userDoc.data();
        if (profileData?.dob instanceof Timestamp) {
            profileData.dob = profileData.dob.toDate().toISOString().split('T')[0];
        }
    }

    return { user: decodedIdToken, profile: profileData };
  } catch (error) {
    console.error('Session verification failed:', error);
    return { user: null, profile: null };
  }
}
