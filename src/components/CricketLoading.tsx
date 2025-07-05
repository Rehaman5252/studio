
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface CricketLoadingProps {
  state?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

const logos = [
    { src: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8d/Board_of_Control_for_Cricket_in_India_logo.svg/1200px-Board_of_Control_for_Cricket_in_India_logo.svg.png', alt: 'BCCI Logo', hint: 'BCCI logo' },
    { src: 'https://upload.wikimedia.org/wikipedia/en/thumb/e/e8/International_Cricket_Council_logo.svg/1200px-International_Cricket_Council_logo.svg.png', alt: 'ICC Logo', hint: 'ICC logo' },
    { src: 'https://upload.wikimedia.org/wikipedia/en/thumb/3/3f/Cricket_Australia_logo.svg/1200px-Cricket_Australia_logo.svg.png', alt: 'Cricket Australia Logo', hint: 'cricket australia' },
    { src: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/6c/England_and_Wales_Cricket_Board_logo.svg/1200px-England_and_Wales_Cricket_Board_logo.svg.png', alt: 'ECB Logo', hint: 'cricket england' },
    { src: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a0/New_Zealand_Cricket_logo.svg/1200px-New_Zealand_Cricket_logo.svg.png', alt: 'NZC Logo', hint: 'cricket new zealand' },
    { src: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/87/Pakistan_Cricket_Board_logo.svg/1200px-Pakistan_Cricket_Board_logo.svg.png', alt: 'PCB Logo', hint: 'cricket pakistan' },
];

const LoadingSpinner = () => {
  const [currentLogoIndex, setCurrentLogoIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLogoIndex((prevIndex) => (prevIndex + 1) % logos.length);
    }, 1500); // Change logo every 1.5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-32 h-32 mb-4 relative flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentLogoIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex items-center justify-center p-4"
        >
          <Image
            src={logos[currentLogoIndex].src}
            alt={logos[currentLogoIndex].alt}
            data-ai-hint={logos[currentLogoIndex].hint}
            width={80}
            height={80}
            className="object-contain"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

const CricketLoading = ({
  state = 'loading',
  message = "Generating your quiz...",
  errorMessage = "It's a wicket! Looks like there was an error.",
  children
}: CricketLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      {state === 'loading' ? (
        <LoadingSpinner />
      ) : (
         <div className="w-32 h-32 mb-4">
            <svg viewBox="0 0 100 100" className="w-full h-full">
            <style>{`
                @keyframes fall-apart { to { transform: translateY(20px) rotate(20deg); opacity: 0; } }
                .wickets-falling rect { transform-origin: bottom center; animation: fall-apart 0.5s ease-in forwards; }
                .wickets-falling rect:nth-child(2) { animation-delay: 0.1s; transform: rotate(-5deg); }
                .wickets-falling rect:nth-child(3) { animation-delay: 0.05s; transform: rotate(5deg); }
            `}</style>
            <g>
                <g className="wickets-falling" transform="translate(37, 30) scale(1.2)">
                    <rect width="6" height="35" fill="hsl(var(--primary))" rx="2" />
                    <rect x="10" width="6" height="35" fill="hsl(var(--primary))" rx="2" />
                    <rect x="20" width="6" height="35" fill="hsl(var(--primary))" rx="2" />
                    <rect x="0" y="-3" width="26" height="4" fill="hsl(var(--primary))" rx="2" />
                </g>
            </g>
            </svg>
        </div>
      )}
      <h2 className="text-xl font-semibold text-foreground/80 text-center">
        {state === 'loading' ? message : errorMessage}
      </h2>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default CricketLoading;
