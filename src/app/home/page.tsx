'use client';

import useRequireAuth from '@/hooks/useRequireAuth';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';

// Dynamically import the main content wrapper.
// This component contains all the logic that depends on frequently updating state,
// isolating it from the static parts of the page and preventing re-renders.
const HomeWrapper = dynamic(() => import('@/components/home/HomeWrapper'), {
  loading: () => (
    <div className="space-y-8">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
      </div>
      <Skeleton className="w-48 h-48 mx-auto" />
      <Skeleton className="w-full mt-8 h-[140px] rounded-2xl" />
      <Skeleton className="w-full my-8 h-[1px]" />
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
      </div>
       <Skeleton className="w-full mt-8 h-[60px] rounded-full" />
    </div>
  ),
  ssr: false, // This component uses hooks that rely on client-side state
});

// The actual page component is now very simple. It handles the initial auth check
// and renders the static layout, delegating all dynamic content to HomeWrapper.
export default function HomeScreen() {
  const { loading: authLoading } = useAuth();
  
  // This is the main page loader for authentication state.
  if (authLoading) {
      return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-6xl font-extrabold tracking-tighter text-shimmer animate-shimmer">
            indcric
          </h1>
          <p className="text-sm text-muted-foreground">Win big with your cricket knowledge</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto px-4 py-8">
          <HomeWrapper />
        </div>
      </main>
    </div>
  );
}
