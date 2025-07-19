// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, initializeFirestore, memoryLocalCache } from "firebase/firestore";

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

// Initialize Firebase App in a client-safe way
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with memory cache to disable offline persistence.
// This is the most reliable way to prevent "client is offline" errors in development.
const db: Firestore = initializeFirestore(app, {
  localCache: memoryLocalCache(),
});

const auth: Auth = getAuth(app);


export { app, auth, db };
