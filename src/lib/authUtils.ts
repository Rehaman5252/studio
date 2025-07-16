
'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import type { DocumentData, Firestore } from 'firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';


export async function createUserDocument(db: Firestore | null, user: User, additionalData: DocumentData = {}) {
  console.log("DBG createUserDocument - db:", db, "user:", user);
  if (!user) {
    console.error("❌ createUserDocument failed: User is missing.");
    return;
  }

  // ✅ Wait up to 2 seconds for db to be ready
  if (!db) {
    console.warn("⏳ Waiting for Firestore to be initialized...");
    const start = Date.now();
    await new Promise<void>((resolve, reject) => {
      const interval = setInterval(() => {
        // This check needs to be against the db instance passed in, which might be updated.
        // In a real scenario, we'd need a way to get the latest instance.
        // For this architecture, we trust the AuthProvider will re-trigger effects.
        // However, this polling logic can be a fallback.
        if (db) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > 2000) {
          clearInterval(interval);
          reject(new Error("Firestore failed to initialize within 2 seconds"));
        }
      }, 100);
    });
  }

  if (!db) {
    console.error("❌ Still no Firestore instance. Aborting.");
    toast({ title: "Error", description: "Database connection failed. Please refresh.", variant: "destructive" });
    return;
  }

  const userDocRef = doc(db, 'users', user.uid);

  try {
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) {
      console.log(`Creating document for new user: ${user.uid}`);
      const { email, displayName, photoURL } = user;
      const createdAt = new Date();

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
        profileCompleted: false,
        phoneVerified: false,
        referralCode: `indcric.com/ref/${(displayName || 'user').split(' ')[0]}${user.uid.substring(0, 4)}`,
        referralEarnings: 0,
        ...additionalData
      });
      console.log("✅ User document created in Firestore");
    }
  } catch (error) {
    console.error("❌ Error in createUserDocument:", error);
    toast({ title: "Error", description: "Could not save user profile.", variant: "destructive" });
    throw error;
  }
}


let isPopupOpen = false;

export async function handleGoogleSignIn(): Promise<User | null> {
  if (!auth) {
    console.error("Auth is not initialized.");
    toast({ title: 'Error', description: 'Authentication service not available.', variant: 'destructive' });
    return null;
  }
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
    return null; // Return null on error
  } finally {
    isPopupOpen = false;
  }
}


export const registerWithEmail = async (email: string, password: string) => {
    if (!auth) throw new Error("Auth service is not initialized.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // The AuthProvider's onAuthStateChanged will handle document creation.
    return userCredential;
};

export const loginWithEmail = async (email: string, password:string) => {
    if (!auth) throw new Error("Auth service is not initialized.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
};
