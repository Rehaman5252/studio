
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";

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
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase services immediately
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

// Enable persistence only on the client-side, and only once.
if (typeof window !== 'undefined') {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn("🔥 Firestore persistence failed: multiple tabs open.");
        } else if (err.code === 'unimplemented') {
          console.warn("🔥 Firestore persistence not supported by this browser.");
        }
    });
}

// Export the initialized services
export { app, auth, db };
