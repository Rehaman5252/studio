
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, enableNetwork, disableNetwork } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// A check to make sure Firebase is configured.
// This is helpful for developers running the app for the first time.
export const isFirebaseConfigured =
  firebaseConfig.apiKey &&
  !firebaseConfig.apiKey.startsWith('YOUR_') &&
  !!firebaseConfig.projectId;

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

if (isFirebaseConfigured && typeof window !== 'undefined') {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    storage = getStorage(app);
    
    // Initialize Firestore and apply the network reset fix.
    const firestoreDb = getFirestore(app);
    db = firestoreDb;

    // This is a specific fix for the "client is offline" error, which can happen
    // if Firestore's internal state gets stuck. This forces it to reconnect.
    (async () => {
        try {
            await disableNetwork(firestoreDb);
            await enableNetwork(firestoreDb);
            console.log("Firestore network state reset successfully.");
        } catch (error) {
            console.error("Error resetting Firestore network state:", error);
        }
    })();
}

export { app, auth, db, storage };
