
'use client';

import { app, isFirebaseConfigured } from './firebase';
import { initializeFirestore, memoryLocalCache, type Firestore } from 'firebase/firestore';

let dbInstance: Firestore | null = null;

/**
 * Gets a client-side Firestore instance, initializing it only once.
 * This function ensures that Firestore is only ever used on the client
 * and prevents race conditions during initialization.
 * @returns A promise that resolves to the Firestore instance.
 */
export const getFirestoreClient = async (): Promise<Firestore> => {
  if (dbInstance) {
    return dbInstance;
  }

  if (typeof window === 'undefined' || !isFirebaseConfigured || !app) {
    // This case should ideally not be hit in a well-structured client-side call,
    // but serves as a safeguard.
    throw new Error('Firestore can only be initialized on the client and when Firebase is configured.');
  }
  
  // Initialize on first call and store the instance
  console.log("Initializing Firestore client for the first time...");
  dbInstance = initializeFirestore(app, { localCache: memoryLocalCache() });
  console.log("✅ Firestore client initialized.");
  
  return dbInstance;
};
