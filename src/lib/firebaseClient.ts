
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let persistenceEnabled = false;

// This function safely initializes Firebase, preventing multiple instances.
function initializeFirebase() {
    if (typeof window !== "undefined") {
        if (!getApps().length) {
            try {
                if (Object.values(firebaseConfig).every(Boolean)) {
                    app = initializeApp(firebaseConfig);
                }
            } catch (e) {
                console.error("Failed to initialize Firebase", e);
            }
        } else {
            app = getApp();
        }

        if (app) {
            auth = getAuth(app);
            db = getFirestore(app);
        }
    }
}

// Initialize on module load.
initializeFirebase();

/** Get the singleton Auth instance; always use this function! */
export function getFirebaseAuth(): Auth | null {
  return auth;
}

/** Get the singleton Firestore instance; always use this function! */
export function getFirebaseFirestore(): Firestore | null {
  if (db && !persistenceEnabled && typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence not supported in this browser.');
      }
    });
    persistenceEnabled = true;
  }
  return db;
}


export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

/**
 * Checks for REAL connectivity to Firebase, not just network interface availability.
 * This is the reliable way to avoid "client is offline" errors.
 */
export async function isFirebaseOnline(): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }

  try {
    // This is a more reliable check. We use a non-existent document to avoid read costs.
    const testDoc = doc(db, "systemHealth/connectivityCheck");
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    // Known offline error codes.
    if (error.code === 'unavailable' || error.code === 'resource-exhausted') {
        return false;
    }
    // For this check, treat other errors as being offline as well.
    return false;
  }
}
