
'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function FirestoreTestPage() {
  const [status, setStatus] = useState('Connecting to Firestore...');

  useEffect(() => {
    const run = async () => {
      if (!db) {
          setStatus('Firestore (db) is not initialized. Check src/lib/firebase.ts and ensure environment variables are set.');
          return;
      }
      try {
        // This tests the connection. It doesn't matter if the document exists.
        // The call itself will fail if the client is offline.
        const snap = await getDoc(doc(db, 'test', 'ping'));
        const message = '✅ Connection to Firestore successful. The client is ONLINE.';
        console.log(message, `(Document 'test/ping' exists: ${snap.exists()})`);
        setStatus(message);
      } catch (error: any) {
         const message = `❌ Firestore connection FAILED. The client is OFFLINE. Error: ${error.message}`;
         console.error(message, error);
         setStatus(message);
      }
    };
    run();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
        <div className="max-w-2xl text-center">
            <h1 className="text-3xl font-bold mb-4">Firestore Connection Test</h1>
            <p className="text-lg p-4 rounded-md bg-card border">
                <strong>Status:</strong> {status}
            </p>
            <p className="text-muted-foreground mt-4">Check the browser's developer console (F12) for more detailed logs.</p>
        </div>
    </div>
  );
}
