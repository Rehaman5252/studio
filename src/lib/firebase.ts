
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

let isFirebaseInitialized = false;

// This function now returns a promise that resolves when initialization is complete.
const initializeFirebaseServices = async () => {
  if (typeof window !== 'undefined' && !isFirebaseInitialized) {
    try {
      await enableIndexedDbPersistence(db);
      console.log('✅ Firestore persistence enabled.');
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Firestore persistence failed: Multiple tabs open. Persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Firestore persistence not available in this browser.');
      } else {
        console.error('🔥 An unknown error occurred with Firestore persistence:', err);
      }
    }
    
    try {
      await enableNetwork(db);
      console.log('📶 Firestore network connection enabled.');
    } catch (err) {
      console.error('❌ Failed to enable Firestore network:', err);
    }
    isFirebaseInitialized = true;
  }
};


const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Do not export db directly. Export a getter that ensures initialization.
export const getInitializedDb = async () => {
    await initializeFirebaseServices();
    return db;
}

export { app, auth, storage, isFirebaseConfigured };
