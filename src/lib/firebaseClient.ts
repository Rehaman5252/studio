
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, connectAuthEmulator } from "firebase/auth";
import { getFirestore, type Firestore, connectFirestoreEmulator } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// This flag ensures we only check for config once.
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

// This function centralizes the initialization.
function initializeFirebase() {
  if (typeof window !== "undefined" && isFirebaseConfigured) {
    if (!getApps().length) {
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
            db = getFirestore(app);
        } catch (e) {
            console.error("Failed to initialize Firebase", e);
        }
    } else if(getApps().length > 0) {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }
  }
}

// Initialize on module load
initializeFirebase();

export function getFirebaseAuth(): Auth {
  if (!auth) {
    initializeFirebase(); // Attempt to re-initialize if not available
    if (!auth) throw new Error("Firebase Auth is not available. Check your configuration and ensure you're on the client-side.");
  }
  return auth;
}

export function getFirebaseFirestore(): Firestore {
  if (!db) {
    initializeFirebase(); // Attempt to re-initialize if not available
    if (!db) throw new Error("Firebase Firestore is not available. Check your configuration and ensure you're on the client-side.");
  }
  return db;
}
