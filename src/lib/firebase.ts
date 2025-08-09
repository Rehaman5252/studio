
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Check if all required environment variables are present
export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.storageBucket &&
  firebaseConfig.messagingSenderId &&
  firebaseConfig.appId
);

let app: FirebaseApp;

// Initialize Firebase only on the client side, and only if it's not already initialized.
if (typeof window !== 'undefined' && isFirebaseConfigured) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
}

// Ensure auth and db are potentially null if not configured or on the server.
const auth = isFirebaseConfigured ? getAuth(app!) : null;
const db = isFirebaseConfigured ? getFirestore(app!) : null;

// This check prevents errors on the server where auth might be null.
if (auth) {
  auth.useDeviceLanguage();
}

export { app, auth, db };
