'use client';

import { getAuth, GoogleAuthProvider, signInWithPopup, type User } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db, app } from '@/lib/firebase';

const createNewUserDocument = async (user: User) => {
  if (!db || !app) return;
  const userDocRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const newUserDoc = {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      phone: user.phoneNumber || '',
      createdAt: serverTimestamp(),
      photoURL: user.photoURL || '',
      emailVerified: user.emailVerified,
      phoneVerified: !!user.phoneNumber,
      totalRewards: 0,
      quizzesPlayed: 0,
      perfectScores: 0,
      referralCode: `indcric.app/ref/${user.uid.slice(0, 8)}`,
      dob: '',
      gender: '',
      occupation: '',
      upi: '',
      highestStreak: 0,
      certificatesEarned: 0,
      referralEarnings: 0,
      favoriteFormat: '',
      favoriteTeam: '',
      favoriteCricketer: '',
    };
    await setDoc(userDocRef, newUserDoc);
  }
};

export const handleGoogleSignIn = async (onSuccess: () => void, onError: (msg: string) => void) => {
  if (!app) {
    onError("Firebase is not configured. Cannot sign in.");
    return;
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    await createNewUserDocument(result.user);
    onSuccess();
  } catch (error: any) {
    let errorMessage = "An unknown error occurred during Google sign-in.";
    if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in was cancelled. Please try again.";
    } else if (error.code === 'auth/network-request-failed') {
        errorMessage = "Network error. Please check your connection and try again.";
    }
    console.error("Google Sign-In Error:", error);
    onError(errorMessage);
  }
};
