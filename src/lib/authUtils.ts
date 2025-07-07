
'use client';

import { auth, db, GoogleAuthProvider } from './firebase';
import { signInWithPopup } from 'firebase/auth';

export const handleGoogleSignIn = async (onSuccess: () => void, onError: (message: string) => void) => {
    if (!auth || !db) {
        console.error("FIREBASE MISSING CONFIG: Please add your Firebase project configuration to your environment variables to enable Google Sign-In.");
        onError("The authentication service is not configured. Please contact the site administrator.");
        return;
    }

    const provider = new GoogleAuthProvider();
    try {
        // The only responsibility of this function is to perform the sign-in.
        // The AuthProvider will automatically detect the new user and handle
        // creating their database document.
        await signInWithPopup(auth, provider);
        onSuccess();

    } catch (authError: any) {
        // This block catches critical errors from signInWithPopup.
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
