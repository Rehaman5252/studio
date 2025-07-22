// src/lib/firebaseClient.ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore
} from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let db: Firestore | null = null;
let auth: Auth | null = null;

if (typeof window !== "undefined") {
    try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
        });
    } catch (error) {
        console.error("Error initializing Firestore with persistence:", error);
        if (!db) {
            try {
                db = getFirestore(app);
            } catch (fallbackError) {
                console.error("Failed to initialize Firestore even with fallback:", fallbackError);
            }
        }
    }
    auth = getAuth(app);
}

export { app, db, auth };
