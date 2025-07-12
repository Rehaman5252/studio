
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

/**
 * Creates a user document in Firestore if it doesn't already exist.
 * This is idempotent and safe to call on every login.
 * @param user The Firebase Auth user object.
 * @param additionalData Any extra data to add to the user document on creation.
 */
export async function createUserDocument(user: User, additionalData: DocumentData = {}) {
  if (!db || !user) return;
  const userRef = doc(db, 'users', user.uid);
  const docSnap = await getDoc(userRef);

  if (!docSnap.exists()) {
    try {
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
    } catch (error) {
        console.error("Error creating user document:", error);
        toast({ title: "Database Error", description: "Could not create user profile.", variant: "destructive" });
    }
  }
}

let googleSignInInProgress = false;
export const handleGoogleSignIn = async (): Promise<User | null> => {
    if (googleSignInInProgress) return null;
    googleSignInInProgress = true;

    const auth = getAuth(app);
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        await createUserDocument(user); // This is idempotent
        toast({ title: "Signed In", description: "Welcome to indcric!" });
        return user;
    } catch (error: any) {
        if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
          console.warn("Google Sign-In was cancelled by the user.");
        } else {
            console.error("Google Sign-In Error", error);
            toast({ title: "Sign-In Error", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
        }
        return null;
    } finally {
        googleSignInInProgress = false;
    }
};

export const registerWithEmail = async (email, password) => {
    const auth = getAuth(app);
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // createUserDocument is called in the form itself after profile update
    return userCredential;
};

export const loginWithEmail = async (email, password) => {
    const auth = getAuth(app);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Ensure document exists on login as a fallback
    await createUserDocument(userCredential.user);
    return userCredential;
};
