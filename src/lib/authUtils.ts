'use client';

import { auth, db, isFirebaseConfigured, GoogleAuthProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const handleGoogleSignIn = async (onSuccess: () => void, onError: (message: string) => void) => {
    if (!isFirebaseConfigured || !auth || !db) {
        onError("The authentication service is not configured. Please contact support.");
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Check if user already exists in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // New user, create a document in Firestore
            await setDoc(userDocRef, {
                uid: user.uid,
                name: user.displayName,
                email: user.email,
                phone: user.phoneNumber || '',
                createdAt: serverTimestamp(),
                totalRewards: 0,
                quizzesPlayed: 0,
                referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
                photoURL: user.photoURL || '',
            });
        }
        
        onSuccess();

    } catch (error: any) {
        console.error("Google Sign-In Error:", error);
        let message = "An unexpected error occurred. Please try again.";
        if (error.code === 'auth/popup-closed-by-user') {
            message = "Sign-in was cancelled. Please try again.";
        } else if (error.code === 'auth/account-exists-with-different-credential') {
            message = "An account already exists with the same email address but different sign-in credentials.";
        }
        onError(message);
    }
};
