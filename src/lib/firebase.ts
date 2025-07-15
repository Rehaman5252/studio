// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, onSnapshot, doc } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required environment variables are set
export const isFirebaseConfigured = !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = typeof window !== 'undefined' ? getDatabase(app) : null;

/**
 * Helper function to wait for Firestore to come online.
 * It uses a "ping" document to check for a successful connection.
 * @param timeout - The maximum time to wait in milliseconds.
 * @returns A promise that resolves to true when connected.
 */
export const waitUntilOnline = (timeout = 3000): Promise<boolean> => {
    return new Promise((resolve) => {
      // A document that likely doesn't exist but can be used to check connectivity.
      const pingDocRef = doc(db, '__ping__', 'connectivity');
      const unsubscribe = onSnapshot(pingDocRef, 
        () => {
            // Success! We received a snapshot, so Firestore is connected.
            unsubscribe();
            resolve(true);
        },
        (error) => {
            // This error handler will also be called on timeout, which is fine.
            console.warn("Firestore connectivity check timed out or failed, proceeding anyway.", error);
            unsubscribe();
            resolve(true); // Resolve anyway after timeout.
        }
      );

      // Fallback timeout in case the connection never resolves.
      setTimeout(() => {
        unsubscribe();
        resolve(true);
      }, timeout);
    });
};

export { app, auth, db, rtdb };
