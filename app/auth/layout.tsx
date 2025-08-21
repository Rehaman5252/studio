
import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <header className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-shimmer animate-shimmer">indcric</h1>
            <p className="text-muted-foreground">win ₹100 for every 100 seconds!</p>
        </header>
        <main className="w-full max-w-md">
            {children}
        </main>
    </div>
  );
}
