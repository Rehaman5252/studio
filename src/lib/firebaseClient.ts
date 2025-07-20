
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, doc, getDoc, type Firestore } from "firebase/firestore";

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

// Ensure app is initialized once
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Immediately initialized and exported
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Enable persistence once, before any db usage
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("🔥 Firestore persistence failed: multiple tabs open");
        } else if (err.code === 'unimplemented') {
          console.warn("🔥 Firestore persistence not supported by this browser");
        } else {
          console.error("🔥 Unknown Firestore persistence error", err);
        }
    });
}

// Safe getter functions that return the initialized instances
export const getFirebaseApp = () => app;
export const getFirebaseAuth = () => auth;
export const getFirebaseFirestore = () => db;


// Test Firebase connectivity
export async function isReallyOnline(): Promise<boolean> {
  if (typeof window === 'undefined' || !navigator.onLine) return false;

  const firestore = getFirebaseFirestore();
  if (!firestore) return false;

  try {
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
