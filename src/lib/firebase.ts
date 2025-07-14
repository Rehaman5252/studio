// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  connectAuthEmulator,
  browserLocalPersistence,
  setPersistence,
} from 'firebase/auth';
import {
  getFirestore,
  connectFirestoreEmulator,
  enableIndexedDbPersistence,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// --- 🔥 Firebase Auth Setup ---
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.error('Auth persistence error:', err);
});

// --- 🗃️ Firestore Setup ---
const db = getFirestore(app);

// --- ⚙️ Offline Persistence ---
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open; offline persistence disabled.');
    } else if (err.code === 'unimplemented') {
      console.warn('This browser doesn’t support offline mode.');
    }
  });
}

// --- ⚙️ Emulator Setup (Optional) ---
if (process.env.NEXT_PUBLIC_USE_EMULATOR === 'true') {
  console.log('%c🔥 Firebase Emulator Enabled', 'color: orange; font-weight: bold;');
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectFirestoreEmulator(db, 'localhost', 8080);
}

export { app, auth, db };
