
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";

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

function initializeFirebase() {
    if (getApps().length === 0) {
        try {
            if (Object.values(firebaseConfig).every(Boolean)) {
                app = initializeApp(firebaseConfig);
            } else {
                console.error("Firebase config is incomplete.");
                return;
            }
        } catch (e) {
            console.error("Failed to initialize Firebase", e);
            return;
        }
    } else {
        app = getApp();
    }

    if (app) {
        if (typeof window !== 'undefined') {
            // Client-side initialization
            if (!auth) auth = getAuth(app);
            if (!db) {
                // Initialize with multi-tab persistence on the client
                db = initializeFirestore(app, {
                    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
                });
            }
        } else {
            // Server-side initialization (no persistence)
            if (!auth) auth = getAuth(app);
            if (!db) db = initializeFirestore(app, { localCache: memoryLocalCache() });
        }
    }
}

// Initialize on first import
initializeFirebase();

export function getFirebaseAuth(): Auth | null {
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!db) {
    // This re-initialization is a safeguard for edge cases,
    // especially in serverless environments where state might not persist between invocations.
    initializeFirebase();
  }
  return db;
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
