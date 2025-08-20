import React from 'react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-grid p-4">
        <header className="mb-8 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight text-primary">indcric</h1>
            <p className="text-muted-foreground">The Ultimate Cricket Quiz</p>
        </header>
        <main className="w-full max-w-md">
            {children}
        </main>
    </div>
  );
}
