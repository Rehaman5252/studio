'use client';

import HomeClientContent from '@/components/home/HomeClientContent';

export default function HomePage() {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="p-4 flex items-center justify-center">
          <div className="text-center">
              <h1 className="text-6xl font-extrabold tracking-tight text-shimmer animate-shimmer">
                indcric
              </h1>
              <p className="text-sm text-muted-foreground">Win ₹100 every 100 seconds!</p>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto px-4 py-2">
            <HomeClientContent />
          </div>
        </main>
      </div>
    );
}
