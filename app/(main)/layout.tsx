
'use client';

import { memo } from 'react';
import BottomNav from '@/components/BottomNav';

function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main>{children}</main>
      <BottomNav />
    </>
  );
}

export default memo(MainAppLayout);
