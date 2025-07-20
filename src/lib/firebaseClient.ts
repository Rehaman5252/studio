
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// This check is crucial for Next.js to prevent trying to initialize Firebase on the server.
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("🔥 Firestore persistence failed: multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("🔥 Firestore persistence not supported by this browser");
    }
  });
}

/**
 * Checks for a real connection to Firebase services, not just navigator.onLine.
 * @returns A promise that resolves to true if connected, false otherwise.
 */
export async function isFirebaseOnline(): Promise<boolean> {
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return false;
  }
  try {
    // A simple, low-cost read operation to a non-existent document.
    // This confirms not only network but also Firestore service availability and permissions.
    const docRef = doc(db, 'system', 'ping');
    await getDoc(docRef);
    return true;
  } catch (e: any) {
    console.warn('Firebase connectivity check failed:', e.code);
    return false;
  }
}

export { db, auth, app };
