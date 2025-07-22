
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore, doc, onSnapshot } from "firebase/firestore";

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
let isOnline = true; // Assume online by default

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
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!db) initializeFirebase();
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

/**
 * Monitors the actual connection to the Firestore backend.
 * @param callback A function that receives the online status (true/false).
 * @returns An unsubscribe function to clean up the listener.
 */
export function monitorFirebaseConnection(callback: (status: boolean) => void) {
  const firestore = getFirebaseFirestore();
  if (!firestore) {
    callback(false);
    return () => {};
  }
  
  // A dummy document reference for the snapshot listener.
  // This does not read or write data, it only monitors the connection.
  const dummyDocRef = doc(firestore, "__connection-check__/status");

  const unsubscribe = onSnapshot(
    dummyDocRef,
    () => {
      if (!isOnline) {
        isOnline = true;
        callback(true);
      }
    },
    (error) => {
      console.error("🔥 Firebase connection listener failed:", error.message);
      if (isOnline) {
        isOnline = false;
        callback(false);
      }
    }
  );

  return unsubscribe;
}

/**
 * Gets the last known status of the Firebase connection.
 * @returns boolean
 */
export function getFirebaseOnlineStatus() {
  return isOnline;
}
