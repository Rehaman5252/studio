
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
  if (!db) {
    // If the db instance itself isn't available, we're effectively offline.
    return false;
  }
  
  // A more reliable check is to see if the browser itself reports being online.
  // The previous check to a Google API was too aggressive and could fail intermittently.
  if (typeof window !== 'undefined' && !navigator.onLine) {
    return false;
  }

  // If the browser is online and we have a db instance, we can be reasonably sure
  // that we can attempt Firestore operations. The SDK will handle offline writes.
  return true;
}
