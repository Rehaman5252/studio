
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, initializeFirestore, enableIndexedDbPersistence, doc, getDoc, type Firestore } from "firebase/firestore";

// Hardcoded config to guarantee connection locally.
const firebaseConfig = {
  apiKey: "AIzaSyAh35l6QoFhYoTUWDc7vA_LpnHN7ZaB92A",
  authDomain: "cricblitz.firebaseapp.com",
  projectId: "cricblitz",
  storageBucket: "cricblitz.appspot.com",
  messagingSenderId: "370076403121",
  appId: "1:370076403121:web:514b379a7fd3f3d491a990"
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== ''
);

// Initialize Firebase App
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Auth
const auth: Auth = getAuth(app);

// Initialize Firestore safely
const db: Firestore = (() => {
  try {
    const firestore = initializeFirestore(app, { ignoreUndefinedProperties: true });
    if (typeof window !== 'undefined') {
      enableIndexedDbPersistence(firestore).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("Firestore persistence failed: can only be enabled in one tab at a time.");
        } else if (err.code === 'unimplemented') {
          console.warn("Firestore persistence not supported in this browser.");
        }
      });
    }
    return firestore;
  } catch (error) {
    console.error("Error initializing Firestore:", error);
    // Fallback to getFirestore if initialize fails for some reason
    return getFirestore(app);
  }
})();


// Safe getter functions
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => db;


// Test Firebase connectivity
export async function isReallyOnline(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  const firestore = getFirebaseFirestore();
  if (!firestore) return false;

  try {
    // Using a non-existent doc path for a read is a lightweight way to check connectivity
    const testDocRef = doc(firestore, `system/connectivity-test-${Date.now()}`);
    await getDoc(testDocRef);
    return true;
  } catch (error: any) {
    if (error.code === 'unavailable') {
        console.warn('Firebase connectivity test failed: Client is offline.');
    } else {
        console.warn('Firebase connectivity test failed with other error:', error.message);
    }
    return false;
  }
}
