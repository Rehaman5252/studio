// lib/firebaseClient.ts
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
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

if (typeof window !== "undefined" && isFirebaseConfigured) {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Enable persistent offline cache and multi-tab support
    // This is the modern way to handle offline persistence and prevents most
    // "client is offline" errors.
    try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
    } catch (e) {
        console.error("Firebase Firestore initialization failed, falling back to memory cache.", e);
        // Fallback to in-memory cache if persistence fails (e.g., in private browsing mode)
        db = initializeFirestore(app, {});
    }

}

/**
 * A more reliable way to check for a network connection with a timeout.
 * @returns {Promise<boolean>}
 */
export async function isReallyOnline(): Promise<boolean> {
  if (typeof window === "undefined" || !navigator.onLine) {
    return false;
  }
  try {
    // Use a lightweight, reliable endpoint for checking connectivity.
    // Using a Google endpoint as it's highly available.
    const response = await fetch("https://www.google.com/generate_204", {
      method: "HEAD",
      cache: "no-store",
    });
    return response.ok;
  } catch {
    // If the fetch fails, trust the browser's less reliable check.
    return navigator.onLine;
  }
}

export { app, auth, db };
