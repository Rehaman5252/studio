
import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 lg:p-8">
      <div className="w-full max-w-md">
        {children}
      </div>
    </main>
  );
}
