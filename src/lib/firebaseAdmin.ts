
// src/lib/firebaseAdmin.ts
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, App } from 'firebase-admin/app';
import { credential } from 'firebase-admin';

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

let app: App;

if (!getApps().length) {
  app = initializeApp({
    credential: credential.cert(JSON.parse(serviceAccount!)),
  });
} else {
  app = getApps()[0];
}

const getFirebaseAuth = () => getAuth(app);

export { getFirebaseAuth };
