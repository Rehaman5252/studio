
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <header className="mb-8 w-full flex flex-col items-center justify-center text-center">
            <h1 className="text-6xl font-extrabold tracking-tight animate-colorChange drop-shadow-lg">
                indcric
            </h1>
            <p className="mt-3 text-lg text-foreground">
                Win ₹100 for every 100 seconds!
            </p>
        </header>
        <main className="w-full max-w-lg">
            {children}
        </main>
    </div>
  );
}
