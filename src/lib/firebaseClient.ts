// src/lib/firebaseClient.ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, setPersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore, doc, getDoc, connectFirestoreEmulator } from "firebase/firestore";

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

if (typeof window !== 'undefined' && !getApps().length && isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
  });

  setPersistence(auth, browserLocalPersistence).catch((err) => {
    console.warn("Firebase Auth persistence error", err);
  });

} else if (getApps().length > 0) {
  app = getApp();
  auth = getAuth(app);
  db = getFirestore(app);
}

/**
 * Checks if the Firebase client is initialized and ready to use.
 * This is crucial for avoiding race conditions on the client.
 */
export function isFirebaseReady(): boolean {
  return !!auth && !!db;
}

/**
 * Checks if the Firebase client is connected to the backend.
 * Returns false if offline or if Firebase isn't initialized.
 */
export async function isFirebaseOnline(): Promise<boolean> {
  if (!db || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }
  try {
    await getDoc(doc(db, "systemHealth/connectivityCheck"));
    return true;
  } catch (error: any) {
    return false;
  }
}

// @ts-ignore - These are initialized in the client-side check above.
export { app, auth, db };
