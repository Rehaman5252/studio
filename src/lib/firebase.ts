
'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const isFirebaseConfigured = !!firebaseConfig.apiKey && !!firebaseConfig.projectId;

// Hard-reset the network connection to fix issues where Firestore gets stuck offline.
// This is safe to run on every app load.
(async () => {
    if (db && isFirebaseConfigured) {
        try {
            await disableNetwork(db);
            await enableNetwork(db);
            console.log('✅ Firestore network connection has been reset.');
        } catch (err) {
            console.warn('⚠️ Could not reset Firestore network connection:', err);
        }
    }
})();

export { app, auth, db, storage, isFirebaseConfigured };
