
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

// This function should only be called on the client side.
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

// Initialize on first load.
initializeFirebase();

export function getFirebaseAuth(): Auth | null {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!db) initializeFirebase();
  if (db && typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        // This can happen if multiple tabs are open.
      } else if (err.code === 'unimplemented') {
        // Persistence is not supported in this browser.
      }
    });
  }
  return db;
}

export const firebaseApp = app;

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export async function isFirebaseOnline(): Promise<boolean> {
  const firestore = getFirebaseFirestore();
  if (!firestore || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }
  try {
    // A lightweight check against a non-existent doc.
    await getDoc(doc(firestore, "systemHealth/connectivityCheck"));
    return true;
  } catch (error: any) {
    // An error here likely means we are offline or have a config issue.
    return false;
  }
}
