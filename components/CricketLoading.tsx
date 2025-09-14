
'use client';

import { motion } from 'framer-motion';

export function CricketLoading() {
  const containerVariants = {
    start: {
      transition: {
        staggerChildren: 0.1,
      },
    },
    end: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const circleVariants = {
    start: {
      y: '0%',
    },
    end: {
      y: '100%',
    },
  };

  const circleTransition = {
    duration: 0.4,
    repeat: Infinity,
    repeatType: 'reverse' as const,
    ease: 'easeInOut',
  };

  return (
    <div className="flex justify-center items-center h-24">
      <motion.div
        className="w-40 h-10 flex justify-around"
        variants={containerVariants}
        initial="start"
        animate="end"
      >
        <motion.span
          className="block w-4 h-4 bg-primary rounded-full"
          variants={circleVariants}
          transition={circleTransition}
        />
        <motion.span
          className="block w-4 h-4 bg-primary rounded-full"
          variants={circleVariants}
          transition={{ ...circleTransition, delay: 0.1 }}
        />
        <motion.span
          className="block w-4 h-4 bg-primary rounded-full"
          variants={circleVariants}
          transition={{ ...circleTransition, delay: 0.2 }}
        />
         <motion.span
          className="block w-4 h-4 bg-primary rounded-full"
          variants={circleVariants}
          transition={{ ...circleTransition, delay: 0.3 }}
        />
      </motion.div>
    </div>
  );
}
