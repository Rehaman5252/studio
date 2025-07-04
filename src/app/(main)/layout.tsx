import React from 'react';

// This layout is no longer in use, the sidebar has been removed.
export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
