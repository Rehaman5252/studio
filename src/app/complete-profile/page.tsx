
'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function CompleteProfilePageContent() {
  const user = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
        router.replace('/auth/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        setUserData(doc.data() ?? null);
        setIsUserDataLoading(false);
      });
      return () => unsub();
    } else {
        setIsUserDataLoading(false);
    }
  }, [user]);

  if (isUserDataLoading || !user) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex items-center justify-center p-4">
        <CompleteProfileForm />
      </main>
    </div>
  );
}

export default function CompleteProfilePage() {
  return <CompleteProfilePageContent />;
}
