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

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let firebaseReady: Promise<Firestore> | null = null;

export const getInitializedDb = (): Promise<Firestore> => {
  if (!firebaseReady && typeof window !== 'undefined' && isFirebaseConfigured) {
    firebaseReady = (async () => {
      try {
        await enableIndexedDbPersistence(db);
        console.log('✅ IndexedDB persistence enabled');
      } catch (e) {
        console.warn('⚠️ IndexedDB persistence failed:', e);
      }

      try {
        await enableNetwork(db);
        console.log('📶 Firestore network enabled');
      } catch (e) {
        console.error('❌ Failed to enable network:', e);
      }

      return db;
    })();
  }

  return firebaseReady || Promise.resolve(db);
};

export { app, auth, db, storage, isFirebaseConfigured };