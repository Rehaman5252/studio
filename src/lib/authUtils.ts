
'use client';

import { getAuth, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * Creates a user document in Firestore if it doesn't already exist.
 * This is idempotent and safe to call on every login.
 * @param user The Firebase Auth user object.
 */
export const createUserDocument = async (user: User) => {
    if (!db) return;
    const userDocRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userDocRef);

    // Only create a new document if one doesn't exist
    if (!docSnap.exists()) {
        const newUserDoc = {
            uid: user.uid,
            name: user.displayName,
            email: user.email,
            createdAt: serverTimestamp(),
            photoURL: user.photoURL,
            emailVerified: user.emailVerified,
            profileCompleted: false, // Explicitly false for new users
            // Set some default empty/zero values for other fields
            phone: '',
            phoneVerified: false,
            totalRewards: 0,
            quizzesPlayed: 0,
            perfectScores: 0,
            referralCode: `indcric.app/ref/${user.uid.slice(0, 8)}`,
        };
        await setDoc(userDocRef, newUserDoc);
    }
};


/**
 * Handles the Google Sign-In popup flow, creates a user document,
 * and navigates to the appropriate page.
 * @param router The Next.js router instance for navigation.
 */
export const handleGoogleSignIn = async (router: AppRouterInstance) => {
  if (!app) {
    throw new Error("Firebase is not configured. Cannot sign in.");
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user) throw new Error("Google sign-in returned no user.");
    
    await createUserDocument(user);
    console.log("✅ Google Sign-in + Firestore Save successful");

    // Explicitly navigate to complete the profile. AuthGuard will handle routing from there.
    router.push('/complete-profile');

  } catch (error: any) {
    console.error("❌ Google Sign-in failed:", error);
    // Provide a user-friendly message
    alert("Google Sign-in failed. Please try again. Reason: " + error?.message);
  }
};
