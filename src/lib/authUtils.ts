'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
  updateProfile,
} from 'firebase/auth';
import { db, auth } from './firebaseClient';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { sanitizeUserProfile } from './sanitizeUserProfile';

export async function createUserDocument(user: User, additionalData: Record<string, any> = {}) {
  if (!db) return;

  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
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
      referralCode: `https://cricblitz.com/auth/signup?ref=${user.uid.substring(0, 8)}`,
      referralEarnings: 0,
    };

    try {
      await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
    } catch (error) {
      console.error("Error creating user document:", error);
      toast({ title: "Error", description: "Could not initialize user profile.", variant: "destructive" });
    }
  }
}

let isPopupOpen = false;

export async function handleGoogleSignIn(): Promise<User | null> {
  if (isPopupOpen || !auth) return null;
  
  isPopupOpen = true;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user);
    return result.user;
  } catch (error: any) {
    if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
        console.error("Google Sign-in error:", error);
        toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
    }
    return null;
  } finally {
    isPopupOpen = false;
  }
}

export const registerWithEmail = async (email: string, password: string, name: string) => {
    if (!auth) throw new Error("Auth not initialized");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserDocument(userCredential.user, { name });
    return userCredential;
};

export const loginWithEmail = async (email: string, password:string) => {
    if (!auth) throw new Error("Auth not initialized");
    return await signInWithEmailAndPassword(auth, email, password);
};
