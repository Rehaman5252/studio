
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
  enableIndexedDbPersistence(db).catch(() => {});
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
