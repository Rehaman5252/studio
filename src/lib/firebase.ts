
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence, enableNetwork, Firestore } from 'firebase/firestore';
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
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

let persistenceEnabled = false;

const initializeFirebaseServices = async () => {
  if (typeof window !== 'undefined' && !persistenceEnabled) {
    try {
      await enableIndexedDbPersistence(db);
      console.log('✅ Firestore persistence enabled.');
      persistenceEnabled = true;
    } catch (err: any) {
      if (err.code === 'failed-precondition') {
        console.warn('⚠️ Firestore persistence failed: Multiple tabs open. Persistence can only be enabled in one tab at a time.');
      } else if (err.code === 'unimplemented') {
        console.warn('⚠️ Firestore persistence not available in this browser.');
      } else {
        console.error('🔥 An unknown error occurred with Firestore persistence:', err);
      }
    }
  }
  try {
    await enableNetwork(db);
    console.log('📶 Firestore network connection enabled.');
  } catch (err) {
    console.error('❌ Failed to enable Firestore network:', err);
  }
};

let dbInitialized: Promise<Firestore> | null = null;
const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

export const getInitializedDb = (): Promise<Firestore> => {
    if (!dbInitialized) {
        dbInitialized = new Promise(async (resolve) => {
            await initializeFirebaseServices();
            resolve(db);
        });
    }
    return dbInitialized;
}

export { app, auth, storage, isFirebaseConfigured };
