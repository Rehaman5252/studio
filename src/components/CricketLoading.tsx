
'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface CricketLoadingProps {
  state?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

const BatAndBallSpinner = () => (
  <div className="w-32 h-32 relative">
    <style>{`
      @keyframes bat-swing {
        0% { transform: rotate(-20deg); }
        50% { transform: rotate(40deg); }
        100% { transform: rotate(-20deg); }
      }
      @keyframes ball-fly {
        0%, 45% { transform: translate(0, 0) scale(1); opacity: 1; }
        55% { transform: translate(10px, -5px) scale(1.1); }
        100% { transform: translate(80px, -80px) scale(0.5); opacity: 0; }
      }
      .bat { 
        transform-origin: 5px 85px; 
        animation: bat-swing 1.2s cubic-bezier(0.6, 0, 0.4, 1) infinite; 
      }
      .ball { 
        transform-origin: center; 
        animation: ball-fly 1.2s cubic-bezier(0.5, 1, 0.8, 1) infinite; 
      }
    `}</style>
    <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible drop-shadow-lg">
      <g className="ball" transform="translate(35, 70)">
        <circle r="6" fill="hsl(var(--primary))" />
      </g>
      <g className="bat" transform="translate(20, 0)">
        {/* Bat Handle */}
        <rect x="0" y="65" width="10" height="25" rx="3" fill="hsl(var(--muted-foreground))" />
        {/* Bat Body */}
        <path d="M-10,65 L20,65 L12,15 L-2,15 Z" fill="hsl(var(--foreground))" />
      </g>
    </svg>
  </div>
);

const CricketLoading = ({
  state = 'loading',
  message = "Generating your quiz...",
  errorMessage = "It's a wicket! Looks like there was an error.",
  children
}: CricketLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      {state === 'loading' ? (
        <BatAndBallSpinner />
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
