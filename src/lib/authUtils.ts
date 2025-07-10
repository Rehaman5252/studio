
'use client';

import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    type User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Creates a user document in Firestore if it doesn't already exist.
 * This is idempotent and safe to call on every login.
 * @param user The Firebase Auth user object.
 */
export async function createUserDocument(user: User) {
    if (!db) return;
    const userRef = doc(db, 'users', user.uid);
    
    // Use merge: true to avoid overwriting existing data, but combine it with a check
    // to only set initial values for brand new users.
    const docSnap = await getDoc(userRef);

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
            totalRewards: 0,
            quizzesPlayed: 0,
            perfectScores: 0,
            certificatesEarned: 0,
            referralCode: `indcric.app/ref/${user.uid.slice(0, 8)}`,
            referralEarnings: 0,
        };
        await setDoc(userRef, defaultData, { merge: true });
    }
}


/**
 * Handles the Google Sign-In popup flow, creates a user document,
 * and navigates to the appropriate page.
 * @param router The Next.js router instance for navigation.
 */
export async function handleGoogleSignIn(router: AppRouterInstance) {
  if (!app) {
    console.error("Firebase is not configured. Cannot sign in.");
    // In a real app, you might show a toast notification here.
    return;
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) throw new Error("Google sign-in returned no user.");
    
    // Ensure a user document exists in Firestore.
    await createUserDocument(user);
    
    // Redirect to complete the profile after sign-in. AuthGuard will handle further navigation.
    router.push('/complete-profile');

  } catch (error: any) {
    // This is not a "real" error, just the user closing the window.
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn("User closed the Google Sign-In popup.");
    } else {
      console.error("Google Sign-In failed:", error);
      // Optionally, show a toast to the user.
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
    if (!auth) throw new Error("Auth service is not available.");
    return await signInWithEmailAndPassword(auth, email, password);
};
