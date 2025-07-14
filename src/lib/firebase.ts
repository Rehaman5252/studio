
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  enableIndexedDbPersistence,
  enableNetwork,
  Firestore,
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const storage = getStorage(app);

const isFirebaseConfigured: boolean = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// GUARANTEED async-safe initialization
let dbInitialized: Promise<Firestore> | null = null;

export const getInitializedDb = (): Promise<Firestore> => {
  if (!dbInitialized) {
    dbInitialized = (async () => {
      const db = getFirestore(app);
      if (typeof window !== 'undefined') {
        try {
          await enableIndexedDbPersistence(db);
          console.log('✅ Firestore persistence enabled.');
        } catch (err: any) {
          if (err.code === 'failed-precondition') {
            console.warn('⚠️ Firestore persistence failed: Multiple tabs open.');
          } else if (err.code === 'unimplemented') {
            console.warn('⚠️ Firestore persistence not available in this browser.');
          } else {
            console.error('🔥 Unknown Firestore persistence error:', err);
          }
        }
      }
      try {
        await enableNetwork(db);
        console.log('📶 Firestore network enabled');
      } catch (err) {
        console.error('❌ Firestore network enable failed:', err);
      }

      return db;
    })();
  }
  return dbInitialized;
};

export { app, auth, storage, isFirebaseConfigured };
