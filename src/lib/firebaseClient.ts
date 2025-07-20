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

// A function to safely check if the configuration is valid
export const isFirebaseConfigured = Object.values(firebaseConfig).every(
  (value) => typeof value === 'string' && value.trim() !== ''
);

if (!isFirebaseConfigured && typeof window !== 'undefined') {
  console.error(
    '🔴 Firebase configuration is invalid or incomplete. Please check your environment variables.'
  );
}

// Singleton instances for client-side
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

function initializeFirebase() {
  if (typeof window === 'undefined' || !isFirebaseConfigured) {
    return;
  }
  if (!app) {
    try {
      app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      console.log("✅ Firebase initialized successfully.");
    } catch (error) {
      console.error("🔥 Firebase initialization error:", error);
    }
  }
}

// Call initialization on script load in the client
initializeFirebase();

// Getter functions to ensure consumers get an initialized instance or null
export function getFirebaseApp(): FirebaseApp | null {
  if (!app) initializeFirebase();
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (!auth) initializeFirebase();
  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!db) initializeFirebase();
  return db;
}


export async function isFirebaseOnline(): Promise<boolean> {
  const firestore = getFirebaseFirestore();
  if (!firestore) return false;
  
  try {
    // Firestore's getDoc can sometimes fail with "client is offline" even if the net is up.
    // A more reliable check is a direct fetch to a known endpoint.
    // We can use a simple fetch to Google's favicon as a proxy for internet connectivity.
    await fetch('https://www.google.com/favicon.ico', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-store',
    });
    return true;
  } catch (error) {
    console.warn("Connectivity test failed, user is likely offline:", error);
    return false;
  }
}
