// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  CACHE_SIZE_UNLIMITED,
  getFirestore
} from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey &&
  !!firebaseConfig.authDomain &&
  !!firebaseConfig.projectId;

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

let db: any = null;
let rtdb: any = null;

if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({
          forceOwnership: true,
        }),
      }),
      cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    });
    console.log("Firestore persistence enabled.");
  } catch(error: any) {
    if (error.code === 'failed-precondition') {
        // This is a normal scenario when multiple tabs are open.
        // We can fall back to a non-persistent Firestore instance.
        console.warn('Firestore persistence failed, likely due to multiple tabs. Falling back to memory-only cache.');
        db = getFirestore(app);
    } else {
        console.error("Error enabling Firestore persistence", error);
        db = getFirestore(app); // Fallback in case of other errors
    }
  }
  
  try {
    rtdb = getDatabase(app);
  } catch (error) {
    console.error("Error initializing Realtime Database", error);
  }
}

export { app, auth, db, rtdb };
