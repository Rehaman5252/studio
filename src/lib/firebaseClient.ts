
// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (typeof window !== "undefined") {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Use a truly global singleton to prevent re-initialization, which can cause issues.
    // @ts-ignore
    if (!window._FIRESTORE_INSTANCE) {
      console.log("Initializing Firestore with memoryLocalCache for the first time.");
      // @ts-ignore
      window._FIRESTORE_INSTANCE = initializeFirestore(app, {
        // Use memory cache to disable offline persistence and avoid the "stuck offline" bug.
        localCache: memoryLocalCache(),
      });
    }
    // @ts-ignore
    db = window._FIRESTORE_INSTANCE;
}


export { app, auth, db };
