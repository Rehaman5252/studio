
'use client';

import React from 'react';

interface CricketLoadingProps {
  state?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

const CricketLoading = ({
  state = 'loading',
  message = "Generating your quiz...",
  errorMessage = "It's a wicket! Looks like there was an error.",
  children
}: CricketLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      <div className="w-32 h-32 mb-4">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <style>{`
            .spinner-arc {
              transform-origin: center;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
            .ball {
              transform-origin: center;
              animation: pulse 1.5s ease-in-out infinite;
            }
            @keyframes pulse {
              0%, 100% { transform: scale(0.95); opacity: 0.8; }
              50% { transform: scale(1); opacity: 1; }
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
            <g>
                <path
                    className="spinner-arc"
                    d="M 50,10 A 40,40 0 1 1 10,50"
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth="8"
                    strokeLinecap="round"
                />
                <circle cx="50" cy="50" r="12" fill="hsl(var(--primary))" className="ball" />
            </g>
          ) : (
            <g>
                <g className="wickets-falling" transform="translate(37, 30) scale(1.2)">
                    <rect width="6" height="35" fill="hsl(var(--primary))" rx="2" />
                    <rect x="10" width="6" height="35" fill="hsl(var(--primary))" rx="2" />
                    <rect x="20" width="6" height="35" fill="hsl(var(--primary))" rx="2" />
                    <rect x="0" y="-3" width="26" height="4" fill="hsl(var(--primary))" rx="2" />
                </g>
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
