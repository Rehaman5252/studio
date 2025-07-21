
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

initializeFirebase();

export function getFirebaseAuth(): Auth | null {
  return auth;
}

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

export async function isFirebaseOnline(): Promise<boolean> {
  const db = getFirebaseFirestore();
  // If the browser itself reports offline, we can be sure.
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return false;
  }
  if (!db) {
    return false;
  }

  try {
    // This is a more reliable check for Firestore connectivity.
    // It attempts a minimal read operation. A non-existent doc is fine.
    await getDoc(doc(db, "systemHealth/connectivityCheck"));
    return true;
  } catch (error: any) {
    // Firestore specific 'unavailable' code is a strong signal of being offline.
    if (error.code === 'unavailable') {
        return false;
    }
    // For other errors, we can be optimistic if the browser thinks it's online.
    return typeof window !== 'undefined' && navigator.onLine;
  }
}
