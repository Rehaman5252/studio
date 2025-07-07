
'use client';

import { auth, db, GoogleAuthProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';

export const handleGoogleSignIn = async (onSuccess: () => void, onError: (message: string) => void) => {
    if (!auth || !db) {
        console.error("FIREBASE MISSING CONFIG: Please add your Firebase project configuration to your environment variables to enable Google Sign-In.");
        onError("The authentication service is not configured. Please contact the site administrator.");
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
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
        console.error("Google Sign-In Error:", error.code, error.message);
        let message = "An unexpected error occurred. Please try again.";
        
        switch (error.code) {
            case 'auth/popup-closed-by-user':
                message = "Sign-in was cancelled. Please try again.";
                break;
            case 'auth/account-exists-with-different-credential':
                message = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
                break;
            case 'auth/unauthorized-domain':
                message = "This app's domain is not authorized for Google Sign-In. The developer must add this website's domain to the 'Authorized domains' list in the Firebase Authentication settings.";
                break;
            default:
                message = `An error occurred. (Code: ${error.code})`;
                break;
        }
        onError(message);
    }
};
