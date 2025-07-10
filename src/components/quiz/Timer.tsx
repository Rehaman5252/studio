
'use client';

import { memo } from 'react';

const TimerComponent = ({ timeLeft }: { timeLeft: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = Math.max(0, circumference - (timeLeft / 20) * circumference);

  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-border"
          strokeWidth="10"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        />
        <circle
          className="stroke-current text-primary transition-all duration-1000 linear"
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{timeLeft}</span>
      </div>
    </div>
  );
};

TimerComponent.displayName = 'Timer';
export const Timer = memo(TimerComponent);
