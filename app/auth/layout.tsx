
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <header className="mb-8 w-full flex flex-col items-center justify-center text-center">
            <h1 className="text-6xl font-extrabold tracking-tight animate-shimmer drop-shadow-lg">
                indcric
            </h1>
            <p className="mt-3 text-lg text-foreground/80">
                Step up to the crease and show your knowledge!
            </p>
        </header>
        <main className="w-full max-w-lg">
            {children}
        </main>
    </div>
  );
}
