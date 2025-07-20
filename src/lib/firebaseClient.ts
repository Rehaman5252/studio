// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Validate configuration
const isConfigValid = Object.values(firebaseConfig).every(value => value && value.trim() !== '');

if (!isConfigValid && typeof window !== 'undefined') {
  console.error('Firebase configuration is invalid. Check your environment variables.');
}

// Safe initialization functions
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === 'undefined' || !isConfigValid) return null;
  
  try {
    return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  } catch (error) {
    console.error('Firebase app initialization failed:', error);
    return null;
  }
}

function getFirebaseAuth(): Auth | null {
  const app = getFirebaseApp();
  return app ? getAuth(app) : null;
}

function getFirebaseFirestore(): Firestore | null {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : null;
}

// Test Firebase connectivity
export async function isFirebaseOnline(): Promise<boolean> {
  try {
    const db = getFirebaseFirestore();
    if (!db) return false;
    
    // Create a test document reference (doesn't need to exist)
    const testDoc = doc(db, 'system/connectivity-test');
    await getDoc(testDoc);
    return true;
  } catch (error) {
    console.warn('Firebase connectivity test failed:', error);
    return false;
  }
}

// Safe exports that will not be null when used correctly
export const auth = getFirebaseAuth();
export const db = getFirebaseFirestore();
export const app = getFirebaseApp();

// Export getter functions for guaranteed fresh instances
export { getFirebaseAuth, getFirebaseFirestore, getFirebaseApp, isConfigValid as isFirebaseConfigured };
