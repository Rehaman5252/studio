'use client';

import {
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  type User,
  updateProfile,
} from 'firebase/auth';
import { getFirebaseFirestore, getFirebaseAuth } from './firebaseClient';
import { toast } from '@/hooks/use-toast';
import { doc, getDoc, setDoc, query, where, getDocs, collection, updateDoc, arrayUnion } from 'firebase/firestore';
import { sanitizeUserProfile } from './sanitizeUserProfile';

export async function createUserDocument(user: User, additionalData: Record<string, any> = {}) {
  const db = getFirebaseFirestore();
  if (!user || !db) return;

  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const refCode = additionalData.refCode || null;
    
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
      referredBy: null,
      referrals: [],
      rewardedReferrals: [],
      currentStreak: 0,
      lastStreakTimestamp: null,
      dailyQuizProgress: {}, // a map to track daily quizzes, e.g., { T20: 1, total: 1 }
    };

    try {
      if (refCode) {
        const q = query(collection(db, "users"), where("referralCode", "like", `%${refCode}`));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const referrerDoc = querySnapshot.docs[0];
          newUserProfile.referredBy = referrerDoc.id;
          const referrerRef = doc(db, 'users', referrerDoc.id);
          await updateDoc(referrerRef, {
            referrals: arrayUnion(user.uid)
          });
        }
      }
      await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
    } catch (error) {
      console.error("Error creating user document or updating referrer:", error);
      toast({ title: "Error", description: "Could not save user profile.", variant: "destructive" });
      throw error;
    }
  }
}

let isPopupOpen = false;

export async function handleGoogleSignIn(refCode: string | null = null): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (isPopupOpen || !auth) {
    console.warn("Google Sign-In popup is already open or auth is not initialized.");
    return null;
  }
  isPopupOpen = true;

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });

  try {
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user, { refCode });
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
    return null;
  } finally {
    isPopupOpen = false;
  }
}

export const registerWithEmail = async (email: string, password: string, name: string, refCode: string | null = null) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Auth not initialized");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await createUserDocument(userCredential.user, { name, refCode });
    return userCredential;
};

export const loginWithEmail = async (email: string, password:string) => {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error("Auth not initialized");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
};