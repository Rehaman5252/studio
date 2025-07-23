// src/lib/firebaseClient.ts
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence, type Firestore } from "firebase/firestore";

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
let firestore: Firestore;

// This check ensures Firebase is only initialized on the client side.
if (typeof window !== 'undefined') {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  firestore = getFirestore(app);

  // --- Emulator Support for Local Development ---
  // This block checks if the app is running in a development environment
  // and connects to the local Firebase Emulator Suite if the correct
  // environment variables are set. This is ideal for offline testing.
  if (process.env.NODE_ENV === 'development') {
    if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
      try {
        console.log("Connecting to Firebase Emulator Suite...");
        connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
        connectFirestoreEmulator(firestore, "localhost", 8080);
      } catch (error) {
        console.error("Error connecting to Firebase Emulator:", error);
      }
    }
  }

  // Enable persistence only if supported
  enableIndexedDbPersistence(firestore).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistence failed: Multiple tabs open.');
    } else if (err.code === 'unimplemented') {
      console.warn('Persistence is not supported by this browser.');
    }
  });
}

export { app, auth, firestore };

export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Google Sign-In Error", error);
    throw error; // re-throw to allow caller to handle
  }
};

export const logout = async () => {
  await signOut(auth);
};

export const isFirebaseConfigured = Object.values(firebaseConfig).every(Boolean);