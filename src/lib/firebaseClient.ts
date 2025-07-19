
// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  type Firestore,
  getFirestore,
  enableIndexedDbPersistence,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId;

let app: FirebaseApp;
let auth: Auth | null = null;
let db: Firestore | null = null;

// This guard ensures Firebase is only initialized on the client side.
if (typeof window !== 'undefined') {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  auth = getAuth(app);
  db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    useFetchStreams: false,
  });

  try {
    enableIndexedDbPersistence(db).catch((err) => {
        if (err.code === 'failed-precondition') {
            console.warn('Firestore persistence failed: Multiple tabs open. Persistence will only be enabled in one tab at a time.');
        } else if (err.code === 'unimplemented') {
            console.warn('Firestore persistence failed: The current browser does not support all of the features required to enable persistence.');
        }
    });
  } catch (e) {
      console.error("Firestore persistence setup failed.", e);
  }
}

export { app, auth, db };
