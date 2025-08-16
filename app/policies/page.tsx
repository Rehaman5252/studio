
'use client';

import React from 'react';
import Policies from '@/components/profile/Policies';

export default function PoliciesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
       <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Legal & Policies</h1>
      </header>
       <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
         <Policies />
      </main>
    </div>
  );
}
