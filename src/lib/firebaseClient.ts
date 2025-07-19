// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId;

// Initialize Firebase App in a client-safe way
const app = typeof window !== 'undefined' && isFirebaseConfigured
  ? getApps().length ? getApp() : initializeApp(firebaseConfig)
  : null;

/**
 * Gets the Firebase Auth instance.
 * Throws an error if called on the server.
 * @returns The Firebase Auth instance.
 */
export const getFirebaseAuth = (): Auth => {
    if (!app) {
        throw new Error("Firebase has not been initialized. Please check your configuration and ensure you are on the client-side.");
    }
    return getAuth(app);
};

/**
 * Gets the Firebase Firestore instance.
 * Throws an error if called on the server.
 * @returns The Firebase Firestore instance.
 */
export const getFirebaseDb = (): Firestore => {
    if (!app) {
        throw new Error("Firebase has not been initialized. Please check your configuration and ensure you are on the client-side.");
    }
    return getFirestore(app);
};

export default app;
