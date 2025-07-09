'use client';
import { useEffect, useState } from 'react';
import { db, auth } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

export default function FirebaseTestPage() {
  const [authStatus, setAuthStatus] = useState('Checking Auth...');
  const [firestoreStatus, setFirestoreStatus] = useState('Checking Firestore...');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthStatus(`✅ Signed in as: ${user.email}`);
        try {
          const docRef = doc(db, 'users', user.uid);
          const snap = await getDoc(docRef);
          setFirestoreStatus(
            snap.exists()
              ? '✅ Auth + Firestore working (User document found)'
              : '⚠️ Auth OK, but no Firestore doc for this user yet. (This is normal for new users).'
          );
        } catch (e: any) {
          setFirestoreStatus(`❌ Firestore error: ${e.message}. Check your security rules.`);
        }
      } else {
        setAuthStatus('❌ Not signed in. Please log in to fully test Firestore connection.');
        setFirestoreStatus('Waiting for authenticated user...');
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      <div className="max-w-2xl text-center space-y-6 w-full">
        <h1 className="text-3xl font-bold">Firebase Connection Test</h1>
        <div className="p-4 rounded-md bg-card border text-left">
          <h2 className="font-semibold text-xl mb-2">Authentication</h2>
          <p>
            <strong>Status:</strong> {authStatus}
          </p>
        </div>
        <div className="p-4 rounded-md bg-card border text-left">
          <h2 className="font-semibold text-xl mb-2">Firestore Database</h2>
          <p>
            <strong>Status:</strong> {firestoreStatus}
          </p>
        </div>
        <p className="text-muted-foreground mt-4">
          Check the browser's developer console (F12) for detailed logs.
        </p>
      </div>
    </div>
  );
}
