
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import QuizSelection from '@/components/home/QuizSelection';

export default function HomeClientContent() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-10"
    >
      <QuizSelection />
    </motion.div>
  );
}
