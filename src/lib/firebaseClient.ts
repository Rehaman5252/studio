
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


let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (typeof window !== 'undefined') {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);

  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn("🔥 Persistence failed – multiple tabs open");
    } else if (err.code === 'unimplemented') {
      console.warn("🔥 Persistence not available in this browser");
    }
  });
}

export function getFirebaseAuth(): Auth {
    if (!auth) throw new Error("Firebase Auth is not initialized (likely an SSR issue).");
    return auth;
}

export function getFirebaseFirestore(): Firestore {
    if (!db) throw new Error("Firestore is not initialized (likely an SSR issue).");
    return db;
}

export async function isFirebaseOnline(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;
  try {
    const firestore = getFirebaseFirestore();
    // A simple, low-cost read operation to a non-existent document
    const docRef = doc(firestore, 'system', 'ping'); 
    await getDoc(docRef);
    return true;
  } catch (e: any) {
    // If the error code is 'unavailable', it's a clear sign of being offline.
    // Other errors might not strictly mean offline but indicate a problem.
    if (e.code === 'unavailable') {
        return false;
    }
    // For this app's purpose, we can treat most other failures as an offline state for the user.
    return false;
  }
}
