
'use client';
import { useEffect } from 'react';
import { db } from '@/lib/firebase';
import { enableIndexedDbPersistence } from 'firebase/firestore';

export default function FirebasePersistence() {
  useEffect(() => {
    if (!db) return;

    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firebase persistence failed: multiple tabs open.');
      } else if (err.code === 'unimplemented') {
        console.warn('Firebase persistence not supported in this browser.');
      } else {
        console.error('Firestore persistence error:', err);
      }
    });
  }, []);

  return null;
}
