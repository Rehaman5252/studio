
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth, browserLocalPersistence, initializeAuth } from "firebase/auth";
import { getFirestore, initializeFirestore, memoryLocalCache, persistentLocalCache, persistentMultipleTabManager, type Firestore } from "firebase/firestore";

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
let db: Firestore;

// This function ensures Firebase is initialized only once.
function initializeFirebase() {
    if (getApps().length > 0) {
        return getApp();
    }
    return initializeApp(firebaseConfig);
}

app = initializeFirebase();

// This function ensures Auth is initialized only once, handling client-side specifics.
function getInitializedAuth(): Auth {
    if (auth) {
        return auth;
    }
    if (typeof window !== 'undefined') {
        // This is the recommended way to initialize Auth for the web.
        auth = initializeAuth(app, {
            persistence: browserLocalPersistence,
        });
    } else {
        // Fallback for server-side or environments without a window object.
        auth = getAuth(app);
    }
    return auth;
}

// This function ensures Firestore is initialized only once, handling client/server differences.
function getInitializedFirestore(): Firestore {
    if (db) {
        return db;
    }
    // Check if we're in a browser environment before attempting to enable persistence.
    if (typeof window !== 'undefined') {
        try {
            db = initializeFirestore(app, {
                 localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
            });
        } catch(e) {
            console.warn("Firestore persistence failed, falling back to memory cache.", e);
            db = initializeFirestore(app, { localCache: memoryLocalCache() });
        }
    } else {
        // For server-side rendering, use memory cache.
        db = initializeFirestore(app, { localCache: memoryLocalCache() });
    }
    return db;
}


export const getFirebaseAuth = (): Auth => getInitializedAuth();
export const getFirebaseFirestore = (): Firestore => getInitializedFirestore();
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);
