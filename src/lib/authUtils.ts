
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

        // The user is now authenticated with Firebase Auth.
        // Call onSuccess immediately to redirect the user and provide a fast experience.
        onSuccess();

        // Now, handle the Firestore document creation/check in the background.
        // A failure here should not block the user's login.
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (!userDoc.exists()) {
                await setDoc(userDocRef, {
                    uid: user.uid,
                    name: user.displayName || 'New User',
                    email: user.email,
                    phone: user.phoneNumber || '',
                    createdAt: serverTimestamp(),
                    totalRewards: 0,
                    quizzesPlayed: 0,
                    referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
                    photoURL: user.photoURL || '',
                    // Add default empty fields to prevent profile page errors
                    age: '',
                    gender: '',
                    occupation: '',
                    upi: '',
                    highestStreak: 0,
                    certificatesEarned: 0,
                    referralEarnings: 0,
                });
            }
        } catch (firestoreError: any) {
            // Log the Firestore-specific error but don't show it to the user.
            // The user is successfully logged in; their data will sync later.
            console.warn("Firestore user document check/creation failed, but login was successful. This can happen when offline.", firestoreError.message);
        }

    } catch (authError: any) {
        // This block now only catches critical errors from signInWithPopup.
        if (authError.code === 'auth/popup-closed-by-user') {
            // This is not an error, the user simply closed the window. Do nothing.
            console.log('Google Sign-In was cancelled by the user.');
            return;
        }
        
        console.error("Google Sign-In Error:", authError.code, authError.message);
        let message = "An unexpected error occurred. Please try again.";
        
        switch (authError.code) {
            case 'auth/account-exists-with-different-credential':
                message = "An account already exists with the same email address but different sign-in credentials. Try signing in with the original method.";
                break;
            case 'auth/unauthorized-domain':
                message = "This app's domain is not authorized for Google Sign-In. The developer must add this website's domain to the 'Authorized domains' list in the Firebase Authentication settings.";
                break;
            default:
                message = `An error occurred. (Code: ${authError.code})`;
                break;
        }
        onError(message);
    }
};
