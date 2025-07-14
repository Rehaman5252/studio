
'use client';

import React from 'react';
import BottomNav from '@/components/BottomNav';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 0 
  },
  in: {
    opacity: 1,
    y: 0
  },
  out: {
    opacity: 0,
    y: 0
  }
};

const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.2
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
          transition={pageTransition}
        >
          {children}
          <BottomNav />
        </motion.div>
    </AnimatePresence>
  );
}
