
import type { ReactNode } from 'react';
import { memo } from 'react';

function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full bg-background">
        <header className="mb-4 w-full flex flex-col items-center justify-center text-center">
            <h1 className="text-6xl font-extrabold tracking-tight animate-shimmer drop-shadow-lg">
                indcric
            </h1>
            <p className="mt-3 text-lg text-foreground/80">
                win ₹100 for every 100 seconds!
            </p>
        </header>
        <main className="w-full max-w-lg">
            {children}
        </main>
    </div>
  );
}

export default memo(AuthLayout);
