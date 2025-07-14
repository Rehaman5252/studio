
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
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

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage = getStorage(app);

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

let firebaseReadyPromise: Promise<void> | null = null;

export const initializeFirebaseServices = (): Promise<void> => {
  if (!firebaseReadyPromise && isFirebaseConfigured) {
    firebaseReadyPromise = (async () => {
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
    })();
  }
  return firebaseReadyPromise || Promise.resolve();
};


export { app, auth, db, storage, isFirebaseConfigured };
