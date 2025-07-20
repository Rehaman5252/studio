
'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background p-4 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        {children}
      </motion.div>
    </main>
  );
}
