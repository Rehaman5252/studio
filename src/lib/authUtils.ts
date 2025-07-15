
'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { auth, getFirestoreInstance } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

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
    // The AuthProvider's onAuthStateChanged will handle document creation.
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
    throw error; // Propagate error to the caller component
  } finally {
    isPopupOpen = false;
  }
}


export const registerWithEmail = async (email: string, password: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // The AuthProvider's onAuthStateChanged will handle document creation.
    return userCredential;
};

export const loginWithEmail = async (email: string, password:string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
};
