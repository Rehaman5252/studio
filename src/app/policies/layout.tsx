'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';

export default function PoliciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <BottomNav />
    </>
  );
}
