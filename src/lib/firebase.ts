
// lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager,
  CACHE_SIZE_UNLIMITED,
  getFirestore as getFS, // renamed to avoid conflict
  type Firestore,
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

let db: Firestore | null = null;
let rtdb: any = null;

if (typeof window !== "undefined") {
  try {
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentSingleTabManager({
          forceOwnership: true,
        }),
        cacheSizeBytes: CACHE_SIZE_UNLIMITED
      })
    });
    console.log("Firestore persistence enabled.");
  } catch(error: any) {
    if (error.code === 'failed-precondition') {
        console.warn('Firestore persistence failed, likely due to multiple tabs. Falling back to memory-only cache.');
        db = getFS(app);
    } else {
        console.error("Error enabling Firestore persistence", error);
        db = getFS(app);
    }
  }
  
  try {
    rtdb = getDatabase(app);
  } catch (error) {
    console.error("Error initializing Realtime Database", error);
  }
}

// Function to get the db instance, ensuring it's not null on the client.
const getFirestore = () => {
    if (!db) {
        // This will only happen on the server, where db is not used by these utils.
        // On the client, db is initialized above.
        if (typeof window === 'undefined') {
            console.error("Firestore is not available on the server. This function should only be called on the client.");
            return null;
        }
        // Fallback for any client-side race conditions, though unlikely with this setup.
        db = getFS(app);
    }
    return db;
};


export { app, auth, db, rtdb, getFirestore };
