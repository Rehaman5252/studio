
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
if (typeof window !== "undefined") {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined" || !app) return null;
  return getAuth(app);
}

export function getFirebaseFirestore(): Firestore | null {
  if (typeof window === "undefined" || !app) return null;
  const db = getFirestore(app);
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      // Multiple tabs open, persistence can only be enabled in one.
    } else if (err.code === 'unimplemented') {
      // The current browser does not support all of the
      // features required to enable persistence
    }
  });
  return db;
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => !!value && typeof value === 'string' && value.trim() !== ''
);

export async function isFirebaseOnline(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  try {
    // A lightweight check against a known Google endpoint.
    await fetch('https://www.google.com/generate_204', { mode: 'no-cors' });
    return true;
  } catch (error) {
    console.warn('Firebase connectivity test failed:', error);
    return false;
  }
}
