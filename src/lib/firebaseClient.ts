
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

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let firestore: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }
}

export function getFirebaseAuth(): Auth {
    if (auth) return auth;
    if (app) {
        auth = getAuth(app);
        return auth;
    }
    if (!isFirebaseConfigured) {
        console.error("Firebase is not configured. Auth features will be disabled.");
    }
    // Return a dummy object or throw an error if you need to strictly enforce it
    return {} as Auth;
}

export function getFirebaseFirestore(): Firestore {
    if (firestore) return firestore;
    if (app) {
        firestore = getFirestore(app);
        return firestore;
    }
     if (!isFirebaseConfigured) {
        console.error("Firebase is not configured. Firestore features will be disabled.");
    }
    return {} as Firestore;
}
