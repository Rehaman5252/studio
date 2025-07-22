
import { getFirebaseAuth } from '@/lib/firebaseClient';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '../firebaseAdmin';

// Initialize Firebase Admin SDK
initializeFirebaseAdmin();

/**
 * A server-side utility to get the currently authenticated user and their profile.
 * Reads the session cookie and verifies it using the Firebase Admin SDK.
 * @returns An object containing the user and their profile, or null if not authenticated.
 */
export async function getAuthenticatedUser() {
  const session = cookies().get('session')?.value || '';

  // Validate session cookie
  if (!session) {
    return { user: null, profile: null };
  }

  try {
    const decodedClaims = await getAuth().verifySessionCookie(session, true);
    const user = {
        uid: decodedClaims.uid,
        email: decodedClaims.email,
        emailVerified: decodedClaims.email_verified,
        // Add other relevant fields from decodedClaims
    };

    const db = getFirebaseFirestore();
    const profileDoc = await getDoc(doc(db, "users", user.uid));

    if (!profileDoc.exists()) {
      return { user, profile: null };
    }
    
    const profile = profileDoc.data();
    // Convert any Timestamps to serializable strings
    if (profile?.dob instanceof Timestamp) {
        profile.dob = profile.dob.toDate().toISOString().split('T')[0];
    }

    return { user, profile };

  } catch (error) {
    console.error('Authentication error:', error);
    return { user: null, profile: null };
  }
}
