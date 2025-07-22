
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This flag ensures we only check for config once.
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

// This check ensures Firebase is only initialized on the client side.
if (typeof window !== 'undefined' && isFirebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    try {
        enableIndexedDbPersistence(db);
    } catch (err: any) {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence is not available in this browser.');
        }
    }
}

async function isFirebaseOnline(): Promise<boolean> {
  if (!isFirebaseConfigured || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }
  try {
    const testDoc = doc(db, "systemHealth/connectivityCheck");
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    // This indicates a network failure trying to reach Firestore.
    if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
        return false;
    }
    // For other errors, we can assume it's not a connectivity issue, but for this check, we'll be conservative.
    return false;
  }
}

// Export the initialized services and utility functions.
export { app, auth, db, isFirebaseOnline };
