
'use client';

import { 
    getAuth, 
    GoogleAuthProvider, 
    signInWithPopup, 
    type User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db, app, isFirebaseConfigured } from '@/lib/firebase';
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
    
    // Check if the document already exists
    const docSnap = await getDoc(userRef);

    if (!docSnap.exists()) {
        const defaultData = {
            uid: user.uid,
            email: user.email,
            name: user.displayName,
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            profileCompleted: false,
            phone: '',
            phoneVerified: false,
            emailVerified: user.emailVerified,
            totalRewards: 0,
            quizzesPlayed: 0,
            perfectScores: 0,
            certificatesEarned: 0,
            referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
            referralEarnings: 0,
            ...additionalData // Merge any extra data passed in
        };
        await setDoc(userRef, defaultData);
    } else {
        // If it exists, we can still update key details that might change.
        await setDoc(userRef, { 
            updatedAt: serverTimestamp(),
            // Ensure essential details from provider are updated on login
            email: user.email,
            name: docSnap.data().name || user.displayName, // Don't overwrite existing name with null
            photoURL: user.photoURL || docSnap.data().photoURL, // Don't overwrite existing photoURL with null
        }, { merge: true });
    }
}


let googleSignInInProgress = false;
/**
 * Handles the Google Sign-In popup flow and creates the user document.
 * Includes a flag to prevent multiple popups from being opened.
 * Redirection is handled by the AuthGuard.
 */
export async function handleGoogleSignIn() {
  if (googleSignInInProgress) return;
  googleSignInInProgress = true;

  if (!isFirebaseConfigured || !app) {
    console.error("Firebase is not configured. Cannot sign in.");
    toast({ title: "Configuration Error", description: "Firebase is not configured.", variant: "destructive" });
    googleSignInInProgress = false;
    throw new Error("Firebase is not configured.");
  }
  const auth = getAuth(app);
  const provider = new GoogleAuthProvider();
  
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    if (!user) throw new Error("Google sign-in returned no user.");
    
    await createUserDocument(user, { emailVerified: true });
    toast({ title: "Signed In", description: "Welcome back!" });
    
  } catch (error: any) {
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      console.warn("User cancelled the Google Sign-In popup.");
    } else {
      console.error("Google Sign-In failed:", error.code, error.message);
      toast({ title: "Sign-In Failed", description: "Could not sign in with Google. Please try again.", variant: "destructive" });
    }
  } finally {
    googleSignInInProgress = false;
  }
}

/**
 * Creates a new user with email and password and creates their Firestore document.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The user credential.
 */
export const registerWithEmail = async (email: string, password: string) => {
    const auth = getAuth(app);
    if (!auth) throw new Error("Auth service is not available.");
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user);
    return userCredential;
};

/**
 * Signs in a user with email and password and ensures their Firestore document exists.
 * @param email The user's email.
 * @param password The user's password.
 * @returns The user credential.
 */
export const loginWithEmail = async (email: string, password: string) => {
    const auth = getAuth(app);
    if (!auth) throw new Error("Auth service is not available.");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createUserDocument(userCredential.user);
    return userCredential;
};
