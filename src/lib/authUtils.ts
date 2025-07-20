
'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { toast } from '@/hooks/use-toast';
import type { DocumentData } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebaseClient';
import { sanitizeUserProfile } from './sanitizeUserProfile';

export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    console.log(`📄 Creating document for new user: ${user.uid}`);
    const { email, displayName, photoURL } = user;
    
    const newUserProfile = {
      uid: user.uid,
      email,
      name: additionalData.name || displayName || 'New User',
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
      await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
      console.log("✅ User document created in Firestore");
    } catch (error) {
      console.error("❌ Firestore write failed in createUserDocument:", error);
      toast({ title: "Error", description: "Could not save user profile.", variant: "destructive" });
      throw error;
    }
  }
}

let isPopupOpen = false;

export async function handleGoogleSignIn(): Promise<User | null> {
  if (isPopupOpen) {
    console.warn("Google Sign-In popup is already open.");
    return null;
  }
  isPopupOpen = true;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
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

export const registerWithEmail = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
};

export const loginWithEmail = async (email: string, password:string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
};
