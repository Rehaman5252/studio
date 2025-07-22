
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager, type Firestore, doc, getDoc } from "firebase/firestore";

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
    if (typeof window !== "undefined") {
        if (!getApps().length) {
            try {
                if (Object.values(firebaseConfig).every(Boolean)) {
                    app = initializeApp(firebaseConfig);
                } else {
                    console.error("Firebase config is incomplete. App will not be initialized.");
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
            auth = getAuth(app);
            // Initialize Firestore with offline persistence safely
            if (!db) {
                db = initializeFirestore(app, {
                    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
                });
            }
        }
    }
}

// Initialize on first load
initializeFirebase();

export function getFirebaseAuth(): Auth | null {
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  // The db instance is now initialized safely above.
  return db;
}


export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export async function isFirebaseOnline(): Promise<boolean> {
  const firestoreDb = getFirebaseFirestore();
  if (!firestoreDb || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }

  try {
    // This is a more reliable check. We use a non-existent document to avoid read costs.
    const testDoc = doc(firestoreDb, "systemHealth/connectivityCheck");
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    // Any error during this check suggests we are offline or have a permissions issue.
    // For this check's purpose, we'll treat it as being offline.
    return false;
  }
}
