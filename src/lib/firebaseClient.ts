
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function initializeFirebase() {
    if (typeof window !== "undefined") {
        if (!getApps().length && isFirebaseConfigured) {
            try {
                app = initializeApp(firebaseConfig);
                auth = getAuth(app);
                db = initializeFirestore(app, {
                    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
                });
                setPersistence(auth, browserLocalPersistence);
            } catch (e) {
                console.error("Firebase initialization error:", e);
            }
        } else if (getApps().length > 0) {
            app = getApp();
            auth = getAuth(app);
            db = getFirestore(app);
        }
    }
}

// Ensure Firebase is initialized on first load
initializeFirebase();

/**
 * Returns the singleton Firebase Auth instance.
 * Throws an error if called before initialization.
 */
export function getFirebaseAuth(): Auth {
    if (!auth) {
        initializeFirebase();
        if (!auth) throw new Error("Firebase Auth is not available. Check your configuration and ensure you're on the client-side.");
    }
    return auth;
}

/**
 * Returns the singleton Firestore instance.
 * Throws an error if called before initialization.
 */
export function getFirebaseFirestore(): Firestore {
    if (!db) {
        initializeFirebase();
        if (!db) throw new Error("Firestore is not available. Check your configuration and ensure you're on the client-side.");
    }
    return db;
}

/**
 * Checks if the Firebase client is connected to the backend.
 * Returns false if offline or if Firebase isn't initialized.
 */
export async function isFirebaseOnline(): Promise<boolean> {
  const firestore = getFirebaseFirestore();
  if (!firestore || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }
  try {
    // Using a non-existent doc for a lightweight connectivity check.
    await getDoc(doc(firestore, "systemHealth/connectivityCheck"));
    return true;
  } catch (error: any) {
    return false;
  }
}
