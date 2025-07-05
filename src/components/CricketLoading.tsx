
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
  message = "Getting the pitch ready...",
  errorMessage = "It's a wicket! Looks like there was an error.",
  children
}: CricketLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
      <div className="w-64 h-48 mb-4">
        <svg viewBox="0 0 300 200" className="w-full h-full">
          {/* Pitch */}
          <ellipse cx="150" cy="100" rx="140" ry="50" fill="hsl(var(--muted))" />
          <rect x="50" y="85" width="200" height="30" fill="hsl(var(--secondary))" />
          
          <style>
            {`
              @keyframes bounce {
                0%, 100% { transform: translateY(0) scale(1, 1); animation-timing-function: ease-in; }
                50% { transform: translateY(-40px) scale(0.95, 1.05); animation-timing-function: ease-out; }
              }
              @keyframes shadow {
                0%, 100% { transform: scale(1); opacity: 0.2; }
                50% { transform: scale(0.7); opacity: 0.1; }
              }
              .ball-bouncing { animation: bounce 1.2s infinite; }
              .shadow-bouncing { animation: shadow 1.2s infinite; }

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

              .ball-hit-wicket {
                animation: shake 0.5s linear;
              }
              @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
              }
            `}
          </style>
          
          {state === 'loading' ? (
            <g>
              <ellipse cx="150" cy="110" rx="15" ry="5" fill="black" className="shadow-bouncing" />
              <g transform="translate(150, 95)">
                <circle className="ball-bouncing" r="10" fill="#B71C1C" />
              </g>
            </g>
          ) : (
            <g>
                <g className="wickets-falling" transform="translate(140, 78)">
                    <rect width="4" height="25" fill="hsl(var(--primary))" />
                    <rect x="7" width="4" height="25" fill="hsl(var(--primary))" />
                    <rect x="14" width="4" height="25" fill="hsl(var(--primary))" />
                    <rect x="0" y="-2" width="18" height="3" fill="hsl(var(--primary))" />
                </g>
                <circle className="ball-hit-wicket" cx="150" cy="95" r="10" fill="#B71C1C" />
            </g>
          )}
        </svg>
      </div>
      <h2 className="text-xl font-semibold animate-pulse text-center">
        {state === 'loading' ? message : errorMessage}
      </h2>
      {children && <div className="mt-6">{children}</div>}
    </div>
  );
};

export default CricketLoading;
