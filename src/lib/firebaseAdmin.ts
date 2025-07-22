
// src/lib/firebaseAdmin.ts
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

let app: App;

export function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    app = getApps()[0];
    return;
  }
  
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  
  if (!serviceAccount) {
    throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY for Firebase Admin SDK initialization.');
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

export { app as firebaseAdminApp };
