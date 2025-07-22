// src/lib/firebaseAdmin.ts
import { initializeApp, getApps, App, credential } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App;

export function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
    return;
  }
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccount) {
    // In a real production environment, you would want more robust error handling
    // or a logger service. For now, we throw to make it clear during development.
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY environment variable for Firebase Admin SDK.');
  }

  try {
    const serviceAccountJson = JSON.parse(serviceAccount);
    app = initializeApp({
      credential: credential.cert(serviceAccountJson),
    });
  } catch(e) {
    console.error("Failed to parse Firebase service account key. Ensure it's a valid JSON string.", e);
    throw new Error("Invalid Firebase service account key.");
  }
}

// Initialize on first import
initializeFirebaseAdmin();

export const adminAuth = getAuth(app);
export { app as firebaseAdminApp };
