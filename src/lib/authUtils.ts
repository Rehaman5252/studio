
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
import { doc, setDoc, getDoc, serverTimestamp, type DocumentData, enableNetwork } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';

export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
  if (!db || !user) return;

  try {
    await enableNetwork(db);
    const userRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
      const defaultData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName,
        photoURL: user.photoURL,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        profileCompleted: false,
        phoneVerified: false,
        emailVerified: user.emailVerified,
        totalRewards: 0,
        quizzesPlayed: 0,
        perfectScores: 0,
        referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
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
  try {
    const provider = new GoogleAuthProvider();
    const auth = getAuth(app);
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) throw new Error('No user returned');
    await createUserDocument(user, { emailVerified: true });
    return user;
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user') {
        console.warn('Google sign-in was cancelled by the user.');
    } else {
        console.error("Google Sign-in error:", error.message);
    }
    return null;
  }
}

export const registerWithEmail = async (email, password) => {
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return userCredential;
};

export const loginWithEmail = async (email, password) => {
    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user);
    return userCredential;
};
