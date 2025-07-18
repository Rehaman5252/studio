
'use client';

import { app, isFirebaseConfigured } from './firebase';
import { initializeFirestore, getFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

interface FirebaseClientServices {
  auth: Auth;
  db: Firestore;
}

let clientServices: FirebaseClientServices | null = null;

const getClientServices = (): FirebaseClientServices => {
  if (clientServices) {
    return clientServices;
  }

  if (typeof window === 'undefined' || !isFirebaseConfigured || !app) {
    throw new Error('Firebase can only be initialized on the client and when configured.');
  }

  // Initialize on first call and store the instances
  console.log("Initializing Firebase client services for the first time...");
  const auth = getAuth(app);
  
  // Use getFirestore to prevent re-initialization error
  const db = getFirestore(app);
  
  clientServices = { auth, db };
  console.log("✅ Firebase Auth and Firestore clients are ready.");
  
  return clientServices;
};


/**
 * Gets client-side instances of Auth and Firestore, ensuring they are initialized only once.
 * This function ensures that Firebase services are only ever used on the client
 * and prevents race conditions during initialization.
 * @returns A promise that resolves to an object containing the Auth and Firestore instances.
 */
export const getFirebaseClient = (): Promise<FirebaseClientServices> => {
    // We return a promise to keep a consistent async interface,
    // though the initialization itself is synchronous after the first call.
    return new Promise((resolve) => {
        resolve(getClientServices());
    });
};
