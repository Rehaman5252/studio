
'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Progress } from '@/components/ui/progress';

interface InterstitialLoaderProps {
  logoUrl: string;
  logoHint: string;
  duration?: number; // in ms
  onComplete: () => void;
}

export default function InterstitialLoader({ logoUrl, logoHint, duration = 2000, onComplete }: InterstitialLoaderProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // A little delay to allow for fade-in animations if desired
    const startTimeout = setTimeout(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
          const elapsedTime = Date.now() - startTime;
          const progressValue = Math.min(100, (elapsedTime / duration) * 100);
          setProgress(progressValue);

          if (elapsedTime >= duration) {
            clearInterval(interval);
            onComplete();
          }
        }, 50); // Update progress frequently

        // Cleanup function for the interval
        return () => clearInterval(interval);
    }, 100);


    // Cleanup function for the timeout
    return () => clearTimeout(startTimeout);
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
      <div className="w-48 h-24 relative mb-4">
        <Image src={logoUrl} alt="Brand Logo" fill={true} className="object-contain" data-ai-hint={logoHint} />
      </div>
      <Progress value={progress} className="w-1/2 max-w-xs h-2" />
    </div>
  );
}
