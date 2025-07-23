
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase
const app: FirebaseApp = isFirebaseConfigured ? (getApps().length ? getApp() : initializeApp(firebaseConfig)) : {} as FirebaseApp;

let authInstance: Auth;
let firestoreInstance: Firestore;

try {
  authInstance = isFirebaseConfigured ? getAuth(app) : {} as Auth;
  firestoreInstance = isFirebaseConfigured ? getFirestore(app) : {} as Firestore;
} catch (e) {
  console.error("Firebase initialization failed:", e);
  authInstance = {} as Auth;
  firestoreInstance = {} as Firestore;
}

export const auth: Auth = authInstance;
export const firestore: Firestore = firestoreInstance;

export const isFirebaseOnline = async (): Promise<boolean> => {
    if (!isFirebaseConfigured || !firestore) {
        return false;
    }
    try {
        // A simple "get" operation on a non-existent doc to check connectivity.
        // This is a lightweight way to test the connection without enabling persistence.
        const nonExistentDocRef = doc(firestore, 'health-check/status');
        await getDoc(nonExistentDocRef);
        return true;
    } catch (error: any) {
        // 'unavailable' is a common code for network issues.
        if (error.code === 'unavailable') {
            return false;
        }
        // It might be another error, but for the purpose of a simple online check,
        // we can treat most errors as an "offline" or "unreachable" state.
        console.warn("Firebase connectivity check failed:", error.code);
        return false;
    }
};
