
'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
  if (!db || !user) return;

  const userRef = doc(db, 'users', user.uid);
  
  try {
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const defaultData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || additionalData.name || 'New User',
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profileCompleted: false,
        phoneVerified: false,
        emailVerified: user.emailVerified,
        guidedTourCompleted: false,
        totalRewards: 0,
        quizzesPlayed: 0,
        perfectScores: 0,
        certificatesEarned: 0,
        referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
        referralEarnings: 0,
        ...additionalData
      };
      await setDoc(userRef, defaultData);
    }
  } catch (error) {
      console.error("Error creating user document:", error);
      toast({ title: "Database Error", description: "Could not create user profile.", variant: "destructive" });
  }
}

export async function handleGoogleSignIn() {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user) throw new Error('No user returned from Google Sign-In.');
    
    await createUserDocument(user, { emailVerified: true });
    
    toast({ title: "Signed In", description: `Welcome, ${user.displayName}!` });
    return user;

  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Google sign-in was cancelled by the user.');
    } else {
        console.error("Google Sign-in error:", error);
        toast({ title: 'Sign-in Error', description: error.message || 'An unknown error occurred.', variant: 'destructive' });
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
    await createUserDocument(userCredential.user);
    return userCredential;
};
