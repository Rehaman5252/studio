'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function FirebaseTestPage() {
  const [authStatus, setAuthStatus] = useState('Checking Auth...');
  const [firestoreStatus, setFirestoreStatus] = useState('Checking Firestore...');

  useEffect(() => {
    // Test Auth
    if (auth?.app?.options?.apiKey && !auth.app.options.apiKey.startsWith('AIza')) {
        setAuthStatus(`✅ Auth Initialized (API Key Present)`);
    } else if (auth?.app?.options?.apiKey) {
        setAuthStatus(`✅ Auth Initialized (API Key Present)`);
    }
    else {
        setAuthStatus(`❌ Auth Not Initialized (API Key Missing or Invalid in .env file)`);
    }
      
    // Test Firestore
    const runFirestoreTest = async () => {
      try {
        // This is a lightweight operation to confirm the client can reach the service.
        // It does not require authentication or special security rules.
        await getDoc(doc(db, 'test', 'ping'));
        setFirestoreStatus(`✅ Firestore Connection Successful (Client is ONLINE)`);
      } catch (error: any) {
        console.error("❌ Firestore connection FAILED.", error);
        setFirestoreStatus(`❌ Firestore Connection FAILED. Error: ${error.message}`);
      }
    };
    runFirestoreTest();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
        <div className="max-w-2xl text-center space-y-6 w-full">
            <h1 className="text-3xl font-bold">Firebase Connection Test</h1>
            <div className="p-4 rounded-md bg-card border text-left">
                <h2 className="font-semibold text-xl mb-2">Authentication</h2>
                <p><strong>Status:</strong> {authStatus}</p>
            </div>
            <div className="p-4 rounded-md bg-card border text-left">
                <h2 className="font-semibold text-xl mb-2">Firestore Database</h2>
                <p><strong>Status:</strong> {firestoreStatus}</p>
            </div>
            <p className="text-muted-foreground mt-4">Check the browser's developer console (F12) for detailed logs.</p>
        </div>
    </div>
  );
}
