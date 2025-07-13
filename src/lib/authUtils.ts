
'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { app } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { DocumentData } from 'firebase/firestore';

// This function is now a placeholder as we are using mock data.
// In a real Firestore implementation, this would create a user document.
export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
  if (!user) return;
  console.log(`[Mock] Creating user document for ${user.email} with data:`, {
    uid: user.uid,
    email: user.email,
    name: additionalData.name || user.displayName || 'New User',
    ...additionalData,
  });
  // In a real app, this is where you'd `setDoc` to Firestore.
  // For now, we do nothing as the AuthProvider uses mockUserData.
  return Promise.resolve();
}

export async function handleGoogleSignIn() {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user) throw new Error('No user returned from Google Sign-In.');
    
    // We call this, but it won't write to a DB in the mock setup.
    await createUserDocument(user);
    
    return user;

  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Google sign-in was cancelled by the user.');
    } else {
        console.error("Google Sign-in error:", error);
        toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
    }
    return null;
  }
}

export const registerWithEmail = async (email: string, password: string) => {
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
};

export const loginWithEmail = async (email: string, password: string) => {
    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
};
