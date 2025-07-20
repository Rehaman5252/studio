
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
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let persistenceEnabled = false;

if (typeof window !== "undefined" && !getApps().length) {
  app = initializeApp(firebaseConfig);
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
      persistenceEnabled = true;
      enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore persistence failed: can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore persistence is not available in this browser.");
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
    await fetch(`https://www.googleapis.com/identitytoolkit/v3/relyingparty/getAccountInfo?key=${firebaseConfig.apiKey}`, {
      method: 'POST',
      body: JSON.stringify({ localId: 'test' })
    });
    return true;
  } catch {
    return false;
  }
}
