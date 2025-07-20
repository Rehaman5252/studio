
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
export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== ''
);

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  console.error(
    '🔴 Firebase configuration is invalid or incomplete. Please check your environment variables.'
  );
}

// Safe initialization functions
function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" || !isFirebaseConfigured) return null;
  
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
    
    // This is a lightweight operation that doesn't require a real document.
    // It's used to check if the client can reach the Firestore service.
    const testDoc = doc(db, 'system/ping-test');
    await getDoc(testDoc);
    return true;
  } catch (error: any) {
    // An error here (especially 'unavailable') strongly suggests an offline state.
    if (error.code === 'unavailable') {
        console.warn('Firebase connectivity test failed: Client is offline.');
    } else {
        console.warn('Firebase connectivity test failed:', error.message);
    }
    return false;
  }
}

// Export getter functions for guaranteed fresh instances
export { getFirebaseAuth, getFirebaseFirestore, getFirebaseApp };
