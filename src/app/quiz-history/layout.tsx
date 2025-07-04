import React from 'react';
import BottomNav from '@/components/BottomNav';

export default function QuizHistoryLayout({
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
