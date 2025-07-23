'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | undefined = undefined;
let auth: Auth | undefined = undefined;
let db: Firestore | undefined = undefined;

// This check ensures Firebase is only initialized on the client side.
if (typeof window !== 'undefined' && isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    auth = getAuth(app);
    // This is set once and handles persistence across sessions.
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("Firebase Auth persistence error", err);
    });

    // Use initializeFirestore for modular apps to enable persistence.
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
}

export function isFirebaseReady(): boolean {
  return typeof window !== 'undefined' && !!db && !!auth;
}

export async function isFirebaseOnline(): Promise<boolean> {
  if (!db || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }

  try {
    // This is a more reliable check. We use a non-existent document to avoid read costs.
    const testDoc = doc(db, "systemHealth/connectivityCheck");
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
        return false;
    }
    // For other errors, we can assume it's not a connectivity issue, but for this check, we'll be conservative.
    return false;
  }
}

export { app, auth, db };
