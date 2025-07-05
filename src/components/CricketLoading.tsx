
'use client';

import React from 'react';

interface CricketLoadingProps {
  state?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

const RoyalSpinner = () => (
    <div className="w-24 h-24 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full animate-spin-slow">
            <defs>
                <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 0.5 }} />
                </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gold-gradient)" strokeWidth="4" strokeDasharray="282.7" strokeDashoffset="212" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0 animate-spin-medium">
            <circle cx="50" cy="50" r="35" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" strokeDasharray="219.9" strokeDashoffset="165" strokeLinecap="round" />
        </svg>
        <svg viewBox="0 0 100 100" className="w-full h-full absolute top-0 left-0 animate-spin-fast">
             <circle cx="50" cy="50" r="25" fill="none" stroke="hsl(var(--foreground))" strokeWidth="2" strokeDasharray="157" strokeDashoffset="118" strokeLinecap="round" />
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
        <RoyalSpinner />
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
      <h2 
        className="text-xl font-semibold text-foreground/80 text-center mt-4">
        {state === 'loading' ? message : errorMessage}
      </h2>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default CricketLoading;
