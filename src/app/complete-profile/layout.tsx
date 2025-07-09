'use client';
import React from 'react';

// This layout prevents the BottomNav from showing on the profile completion page
// for a more focused user experience.
export default function CompleteProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
