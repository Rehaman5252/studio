
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, doc, getDoc, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== ''
);

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  console.error(
    '🔴 Firebase configuration is invalid or incomplete. Please check your environment variables.'
  );
}

// Initialize Firebase App
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth: Auth = getAuth(app);

// Initialize Firestore with offline persistence
let db: Firestore;
let persistenceEnabled = false;

try {
  db = initializeFirestore(app, { ignoreUndefinedProperties: true });
  if (typeof window !== 'undefined' && !persistenceEnabled) {
    enableIndexedDbPersistence(db).then(() => {
        persistenceEnabled = true;
        console.log("Firestore offline persistence enabled.");
    }).catch((err) => {
      if (err.code == 'failed-precondition') {
        console.warn("Firestore persistence failed: multiple tabs open.");
      } else if (err.code == 'unimplemented') {
        console.warn("Firestore persistence not supported in this browser.");
      }
    });
  }
} catch (error) {
    console.error("Error initializing Firestore:", error)
    // If initialization fails, fall back to the standard getFirestore
    db = getFirestore(app);
}

// Safe getter functions
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => db;


// Test Firebase connectivity
export async function isReallyOnline(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const firestore = getFirebaseFirestore();
  if (!firestore) return false;

  try {
    const testDocRef = doc(firestore, 'system/ping-test');
    await getDoc(testDocRef);
    return true;
  } catch (error: any) {
    if (error.code === 'unavailable') {
        console.warn('Firebase connectivity test failed: Client is offline.');
    } else {
        console.warn('Firebase connectivity test failed:', error.message);
    }
    return false;
  }
}
