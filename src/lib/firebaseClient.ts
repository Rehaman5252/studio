'use client';

import { app, isFirebaseConfigured } from './firebase';
import { initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

interface FirebaseClientServices {
  auth: Auth;
  db: Firestore;
}

let clientServices: FirebaseClientServices | null = null;

/**
 * Gets client-side instances of Auth and Firestore, initializing them only once.
 * This function ensures that Firebase services are only ever used on the client
 * and prevents race conditions during initialization.
 * @returns A promise that resolves to an object containing the Auth and Firestore instances.
 */
export const getFirebaseClient = async (): Promise<FirebaseClientServices> => {
  if (clientServices) {
    return clientServices;
  }

  if (typeof window === 'undefined' || !isFirebaseConfigured || !app) {
    // This case should ideally not be hit in a well-structured client-side call,
    // but serves as a safeguard.
    throw new Error('Firebase can only be initialized on the client and when configured.');
  }
  
  // Initialize on first call and store the instances
  console.log("Initializing Firebase client services for the first time...");
  const auth = getAuth(app);
  const db = initializeFirestore(app, { localCache: memoryLocalCache() });
  
  clientServices = { auth, db };
  console.log("✅ Firebase Auth and Firestore clients initialized.");
  
  return clientServices;
};
