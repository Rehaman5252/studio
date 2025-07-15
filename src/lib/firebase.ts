
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

// Singleton instance holder for the client-side
let dbInstance: Firestore | null = null;

/**
 * Gets the client-side Firestore instance, initializing it with persistence on the first call.
 * This function should only be called on the client side.
 * @returns The Firestore database instance.
 */
export function getFirestoreInstance(): Firestore {
  if (typeof window === 'undefined') {
    throw new Error("getFirestoreInstance() can only be called on the client side.");
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
          // In case of multiple tabs, we fallback to a non-persistent instance.
          // To get a new instance, we must check if an instance with this name already exists.
          dbInstance = initializeFirestore(app, {});
        } else {
          console.error("Error enabling Firestore persistence", error);
          dbInstance = initializeFirestore(app, {}); // Fallback to memory cache
        }
    }
  }

  return dbInstance;
}

export { app, auth };
