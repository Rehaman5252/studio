import React from 'react';
import Image from 'next/image';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4 lg:p-8">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl lg:grid lg:grid-cols-2">
        <div className="relative hidden h-full lg:block">
          <Image
            src="https://placehold.co/600x800.png"
            alt="A cricket stadium at night"
            data-ai-hint="cricket stadium"
            width={600}
            height={800}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-8 left-8 text-white">
            <h1 className="text-4xl font-bold">indcric</h1>
            <p className="mt-2 text-lg">The ultimate cricket quiz challenge.</p>
          </div>
        </div>
        <div className="bg-card p-8">{children}</div>
      </div>
    </main>
  );
}
