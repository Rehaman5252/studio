
'use client';

import React, { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';

function CompleteProfilePageContent() {
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Redirect if auth is loaded and there's no user
    if (!isAuthLoading && !user) {
        router.replace('/auth/login');
    }
  }, [user, isAuthLoading, router]);

  const handleSaveSuccess = useCallback(() => {
    router.replace('/home');
  }, [router]);

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <main className="flex-1 flex items-center justify-center p-4">
        <CompleteProfileForm onSaveSuccess={handleSaveSuccess} />
      </main>
    </div>
  );
}

export default function CompleteProfilePage() {
  return <CompleteProfilePageContent />;
}
