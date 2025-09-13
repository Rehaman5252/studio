
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth as getFirebaseAuth } from "firebase/auth";
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
let auth: ReturnType<typeof getFirebaseAuth> | null = null;
let db: ReturnType<typeof getFirestore> | null = null;

// Initialize Firebase only on the client side
if (typeof window !== 'undefined' && isFirebaseConfigured) {
    if (!getApps().length) {
        app = initializeApp(firebaseConfig);
    } else {
        app = getApp();
    }
    auth = getFirebaseAuth(app);
    db = getFirestore(app);
    // This check prevents errors on the server where auth might be null.
    auth.useDeviceLanguage();
}

// Export a function to get auth, ensuring it's initialized.
export const getAuth = () => {
    if (!auth) {
        // This will only happen on the server or if config is missing.
        // It's a safeguard.
        if (typeof window !== 'undefined' && isFirebaseConfigured && getApps().length) {
             return getFirebaseAuth(getApp());
        }
        return null;
    }
    return auth;
}

export { app, db };
