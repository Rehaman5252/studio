
'use client';

import { getFirebaseFirestore } from './firebaseClient';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import type { User } from 'firebase/auth';
import { sanitizeUserProfile } from './sanitizeUserProfile';

export async function createUserDocument(user: User, additionalData = {}) {
  const db = getFirebaseFirestore();
  if (!user || !db) return;
  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);
  if (!snapshot.exists()) {
    const { email, displayName, photoURL } = user;
    const newUserProfile = {
      uid: user.uid,
      email,
      name: (additionalData as any).name || displayName || 'New User',
      photoURL: photoURL || `https://placehold.co/100x100.png`,
      createdAt: new Date(),
      emailVerified: user.emailVerified,
      quizzesPlayed: 0,
      perfectScores: 0,
      totalRewards: 0,
      profileCompleted: false,
      phoneVerified: false,
      referralCode: `indcric.com/ref/${(displayName || 'user').split(' ')[0]}${user.uid.substring(0, 4)}`,
      referralEarnings: 0,
      ...additionalData
    };
    try {
      await setDoc(userDocRef, sanitizeUserProfile(newUserProfile));
    } catch (error) {
      toast({ title: "Error", description: "Could not save user profile.", variant: "destructive" });
      throw error;
    }
  }
}
