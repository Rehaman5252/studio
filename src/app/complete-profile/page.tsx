
'use client';

import React, { useEffect } from 'react';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function CompleteProfilePageContent() {
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthLoading && user === null) {
        router.replace('/auth/login');
    }
  }, [user, isAuthLoading, router]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
