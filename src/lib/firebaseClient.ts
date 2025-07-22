
'use client';
/**
 * @fileOverview Firebase Client Initialization
 *
 * This file provides a singleton, client-safe interface for accessing Firebase services.
 * It ensures that Firebase is initialized only once and only on the client side,
 * preventing common SSR and race condition issues in Next.js applications.
 *
 * - getFirebaseAuth(): Returns the singleton Auth instance.
 * - getFirebaseFirestore(): Returns the singleton Firestore instance.
 * - isFirebaseConfigured: A boolean flag to check if Firebase env vars are present.
 * - monitorFirebaseConnection: A utility to listen to real-time Firestore connectivity.
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence, type Firestore, doc, onSnapshot } from "firebase/firestore";

// Your web app's Firebase configuration, securely loaded from environment variables.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A flag to check if all necessary Firebase environment variables have been provided.
// This is useful for providing developer-friendly warnings if the setup is incomplete.
export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);

// Singleton instances of Firebase services.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let persistenceEnabled = false;

/**
 * Initializes the Firebase app and services if they haven't been already.
 * This function is idempotent and safe to call multiple times.
 */
function initializeFirebase() {
    if (typeof window !== "undefined") {
        if (!getApps().length) {
            if (isFirebaseConfigured) {
                app = initializeApp(firebaseConfig);
            } else {
                console.error("Firebase configuration is incomplete. Please check your environment variables.");
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

// Initialize Firebase as soon as this module is loaded on the client.
initializeFirebase();

/**
 * Returns the singleton Firebase Auth instance.
 * Throws an error if Firebase is not configured or initialized.
 * @returns {Auth} The Firebase Auth instance.
 */
export function getFirebaseAuth(): Auth {
  if (!auth) {
      initializeFirebase();
      if (!auth) throw new Error("Firebase Auth is not available. Check your configuration.");
  }
  return auth;
}

/**
 * Returns the singleton Firestore instance and enables offline persistence.
 * Throws an error if Firebase is not configured or initialized.
 * @returns {Firestore} The Firestore instance.
 */
export function getFirebaseFirestore(): Firestore {
  if (!db) {
      initializeFirebase();
      if (!db) throw new Error("Firestore is not available. Check your configuration.");
  }
  // Enable offline persistence if not already enabled.
  if (!persistenceEnabled) {
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore persistence failed: another tab may be open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore persistence is not supported in this browser.');
      }
    });
    persistenceEnabled = true;
  }
  return db;
}

/**
 * Monitors the real-time connection status to Firestore.
 * This is the most reliable way to determine if the client is truly online or offline.
 * @param callback - A function that will be called with the connection status (true for online, false for offline).
 * @returns An unsubscribe function to clean up the listener.
 */
export function monitorFirebaseConnection(callback: (status: boolean) => void): () => void {
    const db = getFirebaseFirestore();
    if (!db) {
        callback(false);
        return () => {};
    }
    // Firestore's internal `.info/connected` document provides a real-time status.
    const connectedDocRef = doc(db, ".info/connected");

    const unsubscribe = onSnapshot(
        connectedDocRef,
        () => { callback(true); },
        (error) => {
            console.error("🔥 Firebase connection listener failed:", error);
            callback(false);
        }
    );

    return unsubscribe;
}
