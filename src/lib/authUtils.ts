
'use client';

import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    type User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db, app, isFirebaseConfigured } from '@/lib/firebase';

/**
 * Creates a user document in Firestore if it doesn't already exist.
 * This is idempotent and safe to call on every login.
 * @param user The Firebase Auth user object.
 * @param additionalData Any extra data to add to the user document on creation.
 */
export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
    if (!db) return;
    const userRef = doc(db, 'users', user.uid);
    
    // Check if the document already exists
    const docSnap = await getDoc(userRef);

    // Only create the document if it doesn't exist to prevent overwriting data
    if (!docSnap.exists()) {
        const defaultData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            profileCompleted: false,
            phone: '',
            phoneVerified: false,
            emailVerified: user.emailVerified,
            totalRewards: 0,
            quizzesPlayed: 0,
            perfectScores: 0,
            certificatesEarned: 0,
            referralCode: `cricblitz.app/ref/${user.uid.slice(0, 8)}`,
            referralEarnings: 0,
            ...additionalData // Merge any extra data passed in
        };
        await setDoc(userRef, defaultData);
    } else {
        // If it exists, we can still update the last login time or other non-initial fields
        await setDoc(userRef, { 
            updatedAt: serverTimestamp(),
            // Ensure essential details from provider are updated on login
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL,
        }, { merge: true });
    }
}


/**
 * Handles the Google Sign-In popup flow and creates the user document.
 * Redirection is handled by the AuthGuard.
 */
export async function handleGoogleSignIn() {
  if (!isFirebaseConfigured || !app) {
    console.error("Firebase is not configured. Cannot sign in.");
    return;
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) throw new Error("Google sign-in returned no user.");
    
    // Ensure a user document exists in Firestore. This is safe to call every time.
    await createUserDocument(user);
    
    // AuthGuard will handle the final redirection after auth state updates.

  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn("User closed the Google Sign-In popup.");
    } else {
      console.error("Google Sign-In failed:", error.code, error.message);
    }
  }
}

/**
 * Creates a new user with email and password.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The user credential.
 */
export const registerWithEmail = async (email: string, password: string) => {
    const auth = getAuth(app);
    if (!auth) throw new Error("Auth service is not available.");
    return await createUserWithEmailAndPassword(auth, email, password);
};

/**
 * Signs in a user with email and password.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The user credential.
 */
export const loginWithEmail = async (email: string, password: string) => {
    const auth = getAuth(app);
    if (!auth) throw new Error("Auth service is not available.");
    return await signInWithEmailAndPassword(auth, email, password);
};
