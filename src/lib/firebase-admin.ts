
import * as admin from 'firebase-admin';

// This file is for server-side use only.
// It initializes the Firebase Admin SDK, which provides privileged access to Firebase services.

// Ensure environment variables are loaded. You might need a package like 'dotenv' if running locally.
import 'dotenv/config';

// Check if the service account details are present in environment variables
const hasServiceAccount = 
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

let adminDb: admin.firestore.Firestore;

if (hasServiceAccount) {
    // Initialize the app if it's not already initialized
    if (!admin.apps.length) {
        try {
            const serviceAccount: admin.ServiceAccount = {
              projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
              privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
              clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            };

            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount),
            });
            console.log('Firebase Admin SDK initialized successfully.');
        } catch (error: any) {
            console.error('Firebase Admin SDK initialization error:', error.stack);
        }
    }
    // Export the admin database instance
    adminDb = admin.firestore();
} else {
    console.warn("Firebase Admin SDK not initialized: Missing service account environment variables.");
    // Assign a dummy object or handle this case as needed
    adminDb = {} as admin.firestore.Firestore;
}

export { adminDb };
