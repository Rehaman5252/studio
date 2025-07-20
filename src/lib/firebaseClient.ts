
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let persistenceEnabled = false;

// Initialize Firebase on the client side only
if (typeof window !== "undefined" && !getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
  } catch(e) {
    console.error("Firebase initialization error", e);
  }
} else if (typeof window !== "undefined") {
  app = getApp();
}

export function getFirebaseAuth(): Auth | null {
  if (!app) return null;
  if (!auth) {
    auth = getAuth(app);
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!app) return null;
  if (!db) {
    db = getFirestore(app);
    if (!persistenceEnabled) {
      enableIndexedDbPersistence(db)
        .then(() => {
            persistenceEnabled = true;
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
              // Persistence can only be enabled in one tab at a time.
            } else if (err.code === 'unimplemented') {
              // The current browser does not support all of the
              // features required to enable persistence.
            }
        });
    }
  }
  return db;
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export async function isFirebaseOnline(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;
  try {
    // A lightweight check against a known-good endpoint
    await fetch('https://www.google.com/generate_204', { mode: 'no-cors' });
    return true;
  } catch {
    return false;
  }
}
