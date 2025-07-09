'use client';

import React from 'react';

// AuthGuard is no longer needed with a default mock user,
// but we keep the file and make it a pass-through component
// to avoid having to remove it from all the files that use it.
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
