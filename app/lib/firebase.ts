
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth as getFirebaseAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  if (!getApps().length) {
    try {
      app = initializeApp(firebaseConfig);
    } catch (e) {
      console.error("Firebase initialization error", e);
    }
  } else {
    app = getApp();
  }
  
  if (app) {
    try {
      auth = getFirebaseAuth(app);
      db = getFirestore(app);
      if (auth) {
        auth.useDeviceLanguage();
      }
    } catch (e) {
      console.error("Firebase services initialization error", e);
    }
  }
}

export function getAuth() {
  if (auth) {
    return auth;
  }
  if (typeof window !== 'undefined' && isFirebaseConfigured) {
    if (!app) {
        if (!getApps().length) {
            try {
              app = initializeApp(firebaseConfig);
            } catch (e) {
              console.error("Firebase initialization error on getAuth", e);
              return null;
            }
        } else {
            app = getApp();
        }
    }
    if (app) {
      try {
        auth = getFirebaseAuth(app);
        return auth;
      } catch (e) {
        console.error("Firebase getAuth service error", e);
      }
    }
  }
  return null;
}

export { app, auth, db };
