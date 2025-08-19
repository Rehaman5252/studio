
'use client';

import React from 'react';

// This is a placeholder component.
// You can add your quiz logic here.
export default function QuizClient({ brand, format }: { brand: string, format: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
      <h1 className="text-3xl font-bold">Quiz Time!</h1>
      <p className="mt-2 text-lg">
        Get ready for the <span className="font-semibold text-primary">{format}</span> quiz,
        brought to you by <span className="font-semibold text-accent">{brand}</span>.
      </p>
      <p className="mt-8 text-muted-foreground">
        (Quiz component implementation is pending)
      </p>
    </div>
  );
}
