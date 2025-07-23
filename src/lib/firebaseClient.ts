// src/lib/firebaseClient.ts

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

// Your Firebase config from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Declare Firebase instances, allowing them to be undefined on the server
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

// Initialize only on client side
if (typeof window !== 'undefined') {
  // Avoid duplicate app initialization
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

  // Initialize Firebase Auth
  auth = getAuth(app);

  // Initialize Firestore with persistent local cache
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
  } catch (e) {
      // This can happen if the cache is already initialized in another tab.
      console.warn("Firestore persistence could not be enabled.", e);
      db = getFirestore(app);
  }
}

// Utility: Check if Firebase is ready
export function isFirebaseReady(): boolean {
  return typeof window !== 'undefined' && !!app && !!auth && !!db;
}

// Export instances
export { app, auth, db };
