
'use client';

import { app, isFirebaseConfigured } from './firebase';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

interface FirebaseClientServices {
  auth: Auth;
  db: Firestore;
}

// This variable will hold the single initialized instances of Firebase services.
let clientServices: FirebaseClientServices | null = null;

/**
 * Initializes and/or returns the client-side instances of Auth and Firestore.
 * This function ensures that Firebase services are initialized only once per client session,
 * preventing the "has already been called" errors.
 *
 * @returns An object containing the Auth and Firestore instances.
 * @throws An error if Firebase is not configured or if called on the server.
 */
const getClientServices = (): FirebaseClientServices => {
  // If the services have already been initialized, return them immediately.
  if (clientServices) {
    return clientServices;
  }

  // Guard against server-side execution or missing configuration.
  if (typeof window === 'undefined' || !isFirebaseConfigured || !app) {
    throw new Error('Firebase can only be initialized on the client and when configured.');
  }

  // Initialize on the first call and store the instances for future use.
  const auth = getAuth(app);
  const db = getFirestore(app);
  
  clientServices = { auth, db };
  
  return clientServices;
};


/**
 * Gets client-side instances of Auth and Firestore in a safe, asynchronous manner.
 * This is the public-facing function to be used throughout the app.
 * @returns A promise that resolves to an object containing the Auth and Firestore instances.
 */
export const getFirebaseClient = (): Promise<FirebaseClientServices> => {
    return new Promise((resolve, reject) => {
        try {
            // getClientServices is synchronous but we wrap it in a promise
            // to maintain a consistent async interface for consumers.
            resolve(getClientServices());
        } catch (error) {
            console.error("Firebase client initialization failed:", error);
            reject(error);
        }
    });
};
