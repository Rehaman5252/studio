
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This guard ensures Firebase is only initialized on the client side.
if (typeof window !== 'undefined' && !getApps().length) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firestore = getFirestore(app);
} else if (getApps().length > 0) {
    app = getApp();
    auth = getAuth(app);
    firestore = getFirestore(app);
} else {
    // Provide non-functional placeholders for SSR
    app = {} as FirebaseApp;
    auth = {} as Auth;
    firestore = {} as Firestore;
}

export { app, auth, firestore };

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export function getFirebaseAuth() {
  return auth;
}

export function getFirebaseFirestore() {
  return firestore;
}

// A simple helper to check if the client is likely online.
// This is not foolproof but helps in many cases.
export async function isFirebaseOnline(): Promise<boolean> {
  try {
    // We try to get a document that doesn't exist.
    // The point is to trigger a network request to a known endpoint.
    const db = getFirebaseFirestore();
    if (!db) return false;
    await getDoc(doc(db, '__check', '__online'));
    return true; // If it doesn't throw, we're online
  } catch (error: any) {
    // If the error code suggests a network issue, we're offline.
    if (error.code === 'unavailable' || error.code === 'permission-denied') {
        // permission-denied can sometimes indicate network issues with Firestore rules.
        // For our check, it means we can reach the service.
        return true; 
    }
    // Any other error could be a network issue.
    return false;
  }
}
