import React from 'react';

// This layout is necessary for the error.tsx file to function correctly
// for the /quiz route segment.
export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
