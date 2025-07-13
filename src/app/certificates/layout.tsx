
'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';

export default function CertificatesLayout({
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
