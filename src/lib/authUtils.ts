
'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { app, auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { DocumentData } from 'firebase/firestore';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';

export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
  if (!user || typeof window === 'undefined') return;

  const db = getFirestore(app);
  const userDocRef = doc(db, 'users', user.uid);
  
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const createdAt = new Date();
    
    try {
      await setDoc(userDocRef, {
        uid: user.uid,
        email,
        name: additionalData.name || displayName || 'New User',
        photoURL: photoURL || `https://placehold.co/100x100.png`,
        createdAt,
        emailVerified: user.emailVerified,
        quizzesPlayed: 0,
        perfectScores: 0,
        totalRewards: 0,
        referralCode: `indcric.com/ref/${(displayName || 'user').split(' ')[0]}${user.uid.substring(0,4)}`,
        referralEarnings: 0,
        ...additionalData
      });
    } catch (error) {
      console.error("Error creating user document:", error);
      toast({ title: 'Error', description: 'Could not save user profile.', variant: 'destructive' });
    }
  }
}

// Guard to prevent multiple popups
let isPopupOpen = false;

export async function handleGoogleSignIn() {
  if (isPopupOpen) {
    console.warn("Google Sign-In popup is already open.");
    return null;
  }
  isPopupOpen = true;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user) throw new Error('No user returned from Google Sign-In.');
    
    await createUserDocument(user);
    
    return user;

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

export const loginWithEmail = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
};
