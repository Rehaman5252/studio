import React from 'react';
import BottomNav from '@/components/BottomNav';

export default function RewardsLayout({
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
