// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  getFirestore,
  memoryLocalCache,
  type Firestore,
} from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
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

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

let db: Firestore;

// This check prevents Firestore from being initialized multiple times during development
// due to Next.js's Fast Refresh feature.
if (typeof window !== "undefined") {
  // @ts-ignore
  if (!window._FIRESTORE_INSTANCE) {
    // @ts-ignore
    window._FIRESTORE_INSTANCE = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  }
  // @ts-ignore
  db = window._FIRESTORE_INSTANCE;
} else {
  // For server-side rendering or environments without a window object
  try {
    db = getFirestore(app);
  } catch (e) {
    db = initializeFirestore(app, {
      localCache: memoryLocalCache(),
    });
  }
}

const auth: Auth = getAuth(app);

export { app, auth, db };
