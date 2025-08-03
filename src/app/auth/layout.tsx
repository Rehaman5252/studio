
import { Sparkles } from 'lucide-react';
import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-secondary">
       <div className="absolute inset-0 bg-grid-slate-900/[0.04] bg-[bottom_1px_center] dark:bg-grid-slate-400/[0.05] dark:bg-bottom dark:border-b dark:border-slate-100/5 [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
       <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-8 z-10">
         <Sparkles className="h-8 w-8" />
         <h1>CricBlitz</h1>
       </div>
      <main className="w-full max-w-md p-4 z-10">{children}</main>
    </div>
  );
}
