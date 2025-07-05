
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import useRequireAuth from '@/hooks/useRequireAuth';

const RewardsContent = dynamic(() => import('@/components/rewards/RewardsContent'), {
  loading: () => <div className="flex-1 flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>,
  ssr: false,
});

export default function RewardsPage() {
  useRequireAuth();

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Rewards Center</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8 pb-20">
        <RewardsContent />
      </main>
    </div>
  );
}
