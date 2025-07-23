
'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = !!firebaseConfig.apiKey;

// Initialize Firebase
const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth: Auth = getAuth(app);
const firestore: Firestore = getFirestore(app);

// Helper function to check for network connectivity to Firebase
export const isFirebaseOnline = async (): Promise<boolean> => {
    if (!isFirebaseConfigured) return false;
    try {
        // A lightweight check against a non-existent document
        const docRef = doc(firestore, 'health-check/status');
        await getDoc(docRef);
        return true;
    } catch (error: any) {
        // 'unavailable' code is a strong indicator of being offline
        if (error.code === 'unavailable') {
            return false;
        }
        // If it's any other error, we might still be "online" but have other issues.
        // For the purpose of this check, we assume connectivity unless explicitly told otherwise.
        return true; 
    }
}

export { app, auth, firestore };
