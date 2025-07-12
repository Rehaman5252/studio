
'use client';

import React from 'react';
import CompleteProfileForm from '@/components/auth/CompleteProfileForm';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

function CompleteProfilePageContent() {
  const { user, loading, isUserDataLoading } = useAuth();
  const router = useRouter();

  if (loading || isUserDataLoading) {
    return (
      <div className="flex flex-col h-screen bg-background items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    router.replace('/auth/login');
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
