
'use client';

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
      // This logic runs ONLY if the user document does not already exist.
      // It's the critical step for creating a new user's profile.
      const defaultData = {
        uid: user.uid,
        email: user.email,
        name: additionalData.name || user.displayName || 'New User',
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
        referralCode: `cricblitz.com/ref/${user.uid.slice(0, 8)}`,
        referralEarnings: 0,
        // Ensure any additional data from the signup form (like name) is included
        ...additionalData
      };
      
      // Create the document with the default data.
      await setDoc(userRef, defaultData);
      console.log('User document created for:', user.email);
    }
  } catch (error) {
      console.error("Error creating or checking user document:", error);
      // Re-throw the error so the calling function (e.g., in SignupForm) can catch it and notify the user.
      throw new Error("Could not create user profile in the database.");
  }
}

export async function handleGoogleSignIn() {
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    if (!user) throw new Error('No user returned from Google Sign-In.');
    
    // This will create the document if it's the user's first time.
    await createUserDocument(user, { emailVerified: true });
    
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
    // On login, we don't need to create a document. The AuthProvider's onAuthStateChanged
    // will handle fetching the existing document.
    return userCredential;
};
