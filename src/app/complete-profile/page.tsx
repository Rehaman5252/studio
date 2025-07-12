
'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function CompleteProfilePageContent() {
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  // We wait for the initial auth check to complete.
  useEffect(() => {
    if (!isAuthLoading && user === null) {
        router.replace('/auth/login');
    }
  }, [user, isAuthLoading, router]);

  // If auth is still loading, show a full-screen loader.
  if (isAuthLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  // If auth is done and there's no user, the useEffect above will redirect.
  // We can also return null or a loader to prevent a flash of content.
  if (!user) {
    return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  // If we have a user, render the form.
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
