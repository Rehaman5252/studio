
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const formats = ['IPL', 'T20', 'ODI', 'WPL', 'Test', 'Mixed', 'World Cup'];
// Duplicate the array to create a seamless loop
const doubledFormats = [...formats, ...formats];

const bannerVariants = {
  animate: {
    x: ['-100%', '0%'],
    transition: {
      x: {
        repeat: Infinity,
        repeatType: 'loop',
        duration: 15, // Slower, smoother animation
        ease: 'linear',
      },
    },
  },
};

const MovingBanner = () => {
  return (
    <div className="relative w-full overflow-hidden bg-card/50 py-3 my-4">
      <motion.div
        className="flex whitespace-nowrap"
        variants={bannerVariants}
        animate="animate"
      >
        {doubledFormats.map((format, index) => (
          <span
            key={index}
            className={cn(
              'mx-4 text-lg font-semibold',
              index % 2 === 0 ? 'text-primary' : 'text-foreground'
            )}
          >
            {format}
          </span>
        ))}
      </motion.div>
       <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent"></div>
       <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent"></div>
    </div>
  );
};

export default MovingBanner;
