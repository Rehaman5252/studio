
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
    if (getApps().length === 0) {
        if (Object.values(firebaseConfig).every(Boolean)) {
            app = initializeApp(firebaseConfig);
        } else {
            console.error("Firebase config is missing or incomplete. Please check your environment variables.");
        }
    } else {
        app = getApp();
    }

    if (app) {
        auth = getAuth(app);
        db = getFirestore(app);
    }
}

// Initialize on client-side load
if (typeof window !== 'undefined') {
    initializeFirebase();
}

export function getFirebaseAuth(): Auth {
    if (!auth) {
        // This might happen if called during SSR, which should be avoided.
        // We initialize here as a fallback, but client components should wait.
        if (typeof window !== 'undefined') {
            initializeFirebase();
        } else {
           throw new Error("FirebaseAuth is not available on the server.");
        }
    }
    return auth!;
}

export function getFirebaseFirestore(): Firestore {
    if (!db) {
         if (typeof window !== 'undefined') {
            initializeFirebase();
            enableIndexedDbPersistence(db!).catch((err) => {
              if (err.code === 'failed-precondition') {
                console.warn('Firestore persistence failed: multiple tabs open.');
              } else if (err.code === 'unimplemented') {
                console.warn('Firestore persistence not supported in this browser.');
              }
            });
        } else {
           throw new Error("Firestore is not available on the server.");
        }
    }
    return db!;
}

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

export async function isFirebaseOnline(): Promise<boolean> {
  const firestore = getFirebaseFirestore();
  if (!firestore || (typeof window !== 'undefined' && !navigator.onLine)) {
    return false;
  }
  try {
    await getDoc(doc(firestore, "systemHealth/connectivityCheck"));
    return true;
  } catch (error: any) {
    return false;
  }
}
