'use client';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function FirestoreTestPage() {
  const [status, setStatus] = useState('Connecting to Firestore...');

  useEffect(() => {
    const run = async () => {
      try {
        const snap = await getDoc(doc(db, 'test', 'ping'));
        console.log('Connected to Firestore:', snap.exists());
        setStatus(`✅ Connection to Firestore successful. The client is ONLINE. (Document 'test/ping' exists: ${snap.exists()})`);
      } catch (error: any) {
        console.error("❌ Firestore connection FAILED.", error);
        setStatus(`❌ Firestore connection FAILED. The client is OFFLINE. Error: ${error.message}`);
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
