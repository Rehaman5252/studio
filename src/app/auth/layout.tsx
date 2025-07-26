
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.main 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex min-h-screen w-full items-center justify-center bg-background p-4 overflow-hidden"
    >
      <div className="w-full max-w-md">
        {children}
      </div>
    </motion.main>
  );
}
