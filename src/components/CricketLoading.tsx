
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CricketLoadingProps {
  state?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

const CricketLoading = ({
  state = 'loading',
  message = "Getting the pitch ready...",
  errorMessage = "It's a wicket! Looks like there was an error.",
  children
}: CricketLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      <div className="w-48 h-48 mb-4">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .spinner {
              transform-origin: center;
              animation: spin 1.5s linear infinite;
            }
            @keyframes fall-apart {
              to {
                transform: translateY(20px) rotate(20deg);
                opacity: 0;
              }
            }
            .wickets-falling rect {
              transform-origin: bottom center;
              animation: fall-apart 0.5s ease-in forwards;
            }
            .wickets-falling rect:nth-child(2) { animation-delay: 0.1s; transform: rotate(-5deg); }
            .wickets-falling rect:nth-child(3) { animation-delay: 0.05s; transform: rotate(5deg); }
          `}</style>
          
          {state === 'loading' ? (
            <g className="spinner">
              <circle cx="100" cy="100" r="70" fill="transparent" stroke="hsl(var(--primary))" strokeWidth="4"/>
              <path d="M100,30 C 140,60 140,140 100,170" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <path d="M100,30 C 60,60 60,140 100,170" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeDasharray="8 6" strokeLinecap="round"/>
            </g>
          ) : (
            <g>
                <g className="wickets-falling" transform="translate(91, 85)">
                    <rect width="6" height="35" fill="hsl(var(--primary))" />
                    <rect x="10" width="6" height="35" fill="hsl(var(--primary))" />
                    <rect x="20" width="6" height="35" fill="hsl(var(--primary))" />
                    <rect x="0" y="-3" width="26" height="4" fill="hsl(var(--primary))" />
                </g>
                <circle cx="100" cy="100" r="10" fill="hsl(var(--primary))" />
            </g>
          )}
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-foreground/80 text-center">
        {state === 'loading' ? message : errorMessage}
      </h2>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default CricketLoading;
