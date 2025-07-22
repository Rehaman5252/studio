
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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== "undefined" && isFirebaseConfigured) {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch((err) => {
        console.warn("Firebase Auth persistence error", err);
    });

    db = initializeFirestore(app, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
    });
}

export async function isFirebaseOnline(): Promise<boolean> {
  if (!db || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }

  try {
    const testDoc = doc(db, "systemHealth/connectivityCheck");
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
        return false;
    }
    return false;
  }
}

// @ts-ignore
export { app, auth, db };
