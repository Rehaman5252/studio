
// lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  CACHE_SIZE_UNLIMITED,
  type Firestore,
} from "firebase/firestore";

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

// Singleton instance holder
let dbInstance: Firestore | null = null;

// The single, reliable way to get the Firestore instance on the client.
export function getFirestoreInstance(): Firestore {
  if (typeof window === 'undefined') {
    // This is a server-side render, return a non-persistent instance or handle as needed.
    // For this app, client-side only is the main pattern, but this prevents SSR errors.
    if (!dbInstance) {
        dbInstance = initializeFirestore(app, {});
    }
    return dbInstance;
  }
  
  if (!dbInstance) {
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentSingleTabManager({
                forceOwnership: true,
            }),
            cacheSizeBytes: CACHE_SIZE_UNLIMITED
        })
      });
      console.log("Firestore persistence enabled.");
    } catch (error: any) {
        if (error.code === 'failed-precondition') {
          console.warn('Firestore persistence failed, likely due to multiple tabs. Falling back to memory-only cache.');
          dbInstance = initializeFirestore(app, {}); // Fallback to memory cache
        } else {
          console.error("Error enabling Firestore persistence", error);
          dbInstance = initializeFirestore(app, {}); // Fallback to memory cache
        }
    }
  }

  return dbInstance;
}

export { app, auth };
