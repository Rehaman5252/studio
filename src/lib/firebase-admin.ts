
import * as admin from 'firebase-admin';

// This file is for server-side use only.
// It initializes the Firebase Admin SDK, which provides privileged access to Firebase services.

// Ensure environment variables are loaded. You might need a package like 'dotenv' if running locally.
import 'dotenv/config';

const serviceAccount: admin.ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
};

// Initialize the app if it's not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('Firebase Admin SDK initialized successfully.');
  } catch (error: any) {
    console.error('Firebase Admin SDK initialization error:', error.stack);
  }
}

// Export the admin database instance
const adminDb = admin.firestore();

export { adminDb };
