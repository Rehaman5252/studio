
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '@/context/AuthProvider';
import useRequireAuth from '@/hooks/useRequireAuth';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileContent = dynamic(() => import('@/components/profile/ProfileContent'), {
    loading: () => (
      <div className="space-y-6">
        <Skeleton className="h-[116px] w-full" />
        <Skeleton className="h-[108px] w-full" />
        <Skeleton className="h-[140px] w-full" />
        <Skeleton className="h-[124px] w-full" />
        <Skeleton className="h-[92px] w-full" />
      </div>
    ),
    ssr: false,
});

export default function ProfilePage() {
    useRequireAuth();
    const { userData, loading } = useAuth();
    
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {loading || !userData ? (
             <div className="flex items-center justify-center h-full">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        ) : (
             <ProfileContent userProfile={userData} />
        )}
      </main>
    </div>
  );
}
