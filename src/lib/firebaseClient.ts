
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

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let persistenceEnabled = false;

if (typeof window !== 'undefined' && !getApps().length) {
    if (Object.values(firebaseConfig).every(v => v)) {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
    } else {
        console.error("Firebase config is incomplete. Authentication and Firestore will not be available.");
    }
} else if (typeof window !== 'undefined') {
    app = getApp();
    auth = getAuth(app);
    db = getFirestore(app);
}

export function getFirebaseFirestore(): Firestore | null {
  if (typeof window === 'undefined') return null;

  if (db && !persistenceEnabled) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Firestore persistence failed: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Firestore persistence not supported in this browser.');
      }
    });
    persistenceEnabled = true;
  }

  return db;
}


export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export async function isFirebaseOnline(): Promise<boolean> {
  const db = getFirebaseFirestore();
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
export { auth, db };
