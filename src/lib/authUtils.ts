
'use client';
/**
 * @fileOverview Authentication Utilities
 *
 * This file contains helper functions for Firebase Authentication processes,
 * including email/password registration, Google Sign-In, and user document creation.
 */

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseAuth, isFirebaseOnline } from './firebaseClient';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sanitizeUserProfile } from './sanitizeUserProfile';

/**
 * Creates a user document in Firestore if one doesn't already exist.
 * This is typically called right after a new user signs up.
 * @param user - The Firebase User object for the newly authenticated user.
 * @param additionalData - Any extra data to merge into the new profile.
 */
export async function createUserDocument(user: User, additionalData = {}) {
  const db = getFirebaseFirestore();
  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  // Only create the document if it doesn't already exist.
  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const newUserProfile = {
      uid: user.uid,
      email,
      name: (additionalData as any).name || displayName || 'New User',
      photoURL: photoURL || `https://placehold.co/100x100.png`,
      createdAt: new Date(),
      emailVerified: user.emailVerified,
      quizzesPlayed: 0,
      perfectScores: 0,
      totalRewards: 0,
      profileCompleted: false,
      phoneVerified: false,
      referralCode: `indcric.com/ref/${(displayName || 'user').split(' ')[0]}${user.uid.substring(0, 4)}`,
      referralEarnings: 0,
      ...additionalData
    };
    try {
      // Sanitize the profile data before saving to remove any undefined values.
      await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
    } catch (error) {
      toast({ title: "Error", description: "Could not create user profile.", variant: "destructive" });
      console.error("Error creating user document: ", error);
      throw error;
    }
  }
}

// A flag to prevent multiple sign-in popups from opening simultaneously.
let isPopupOpen = false;

/**
 * Handles the Google Sign-In process using a popup.
 * @returns The authenticated Firebase User object, or null if it fails.
 */
export async function handleGoogleSignIn(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (isPopupOpen) {
    console.warn("Google Sign-In popup is already open.");
    return null;
  }
  isPopupOpen = true;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const online = await isFirebaseOnline();
    if (!online) {
      throw new Error("Client is offline. Cannot verify user document.");
    }
    await createUserDocument(result.user); // Ensure user doc exists after sign-in.
    return result.user;
  } catch (error: any) {
    // Gracefully handle common "errors" like the user closing the popup.
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
        console.warn('Google sign-in was cancelled by the user.');
    } else if (error.message?.includes("offline") || error.code === 'auth/network-request-failed') {
        toast({ title: 'Offline Error', description: 'Please check your internet connection and try again.', variant: 'destructive' });
    } else {
        console.error("Google Sign-in error:", error);
        toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
    }
    return null;
  } finally {
    isPopupOpen = false;
  }
}

/**
 * Registers a new user with email and password.
 * @param email - The user's email.
 * @param password - The user's chosen password.
 * @returns The Firebase UserCredential object.
 */
export const registerWithEmail = async (email: string, password: string) => {
    const auth = getFirebaseAuth();
    return await createUserWithEmailAndPassword(auth, email, password);
};

export const loginWithEmail = async (email: string, password:string) => {
    const auth = getFirebaseAuth();
    return await signInWithEmailAndPassword(auth, email, password);
};
