'use client';

import { getAuth, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';

/**
 * Creates or updates a user document in Firestore.
 * This function is idempotent. It checks if a document exists.
 * If not, it creates one with default values.
 * If it exists, it merges the new data, preserving existing fields.
 * @param user The Firebase Auth user object.
 * @param additionalData Optional data to merge, like phone number from manual signup.
 */
export const createNewUserDocument = async (user: User, additionalData: Record<string, any> = {}) => {
  if (!db || !app) return;
  const userDocRef = doc(db, 'users', user.uid);

  // Check if the document already exists to avoid overwriting on every login
  const docSnap = await getDoc(userDocRef);

  if (!docSnap.exists()) {
    // Data for a brand new user
    const newUserDoc = {
        uid: user.uid,
        name: user.displayName || '',
        email: user.email,
        createdAt: serverTimestamp(),
        photoURL: user.photoURL || '',
        emailVerified: user.emailVerified,
        phone: user.phoneNumber || additionalData.phone || '',
        phoneVerified: !!user.phoneNumber || additionalData.phoneVerified || false,
        totalRewards: 0,
        quizzesPlayed: 0,
        perfectScores: 0,
        referralCode: `indcric.app/ref/${user.uid.slice(0, 8)}`,
        dob: '',
        gender: '',
        occupation: '',
        upi: '',
        highestStreak: 0,
        certificatesEarned: 0,
        referralEarnings: 0,
        favoriteFormat: '',
        favoriteTeam: '',
        favoriteCricketer: '',
        ...additionalData,
    };
    await setDoc(userDocRef, newUserDoc);
  }
};

/**
 * Handles the Google Sign-In popup flow.
 * Creates a user document in Firestore if it's a new user.
 * Throws an error if sign-in fails, to be caught by the calling component.
 */
export const handleGoogleSignIn = async () => {
  if (!app) {
    throw new Error("Firebase is not configured. Cannot sign in.");
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  
  const result = await signInWithPopup(auth, provider);
  await createNewUserDocument(result.user);
  // No navigation here. AuthGuard will handle redirection.
};
