
'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';
import { motion } from 'framer-motion';

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {children}
      <BottomNav />
    </motion.div>
  );
}
