
'use client';

import React from 'react';
import { Button } from './ui/button';

interface CricketLoadingProps {
  state?: 'loading' | 'error';
  message?: string;
  errorMessage?: string;
  children?: React.ReactNode;
}

const CricketLoading = ({ 
  state = 'loading', 
  message = "Getting the pitch ready...",
  errorMessage = "It's a wicket! Looks like a network error.",
  children
}: CricketLoadingProps) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary via-green-800 to-green-900 text-white p-4">
      <div className="w-64 h-48 mb-4">
        <svg viewBox="0 0 300 200" className="w-full h-full">
          {/* Pitch */}
          <ellipse cx="150" cy="100" rx="140" ry="50" fill="#4CAF50" />
          <rect x="50" y="85" width="200" height="30" fill="#A5D6A7" />
          
          {/* Wickets */}
          <g id="wickets-left" transform="translate(60, 80)">
             <rect width="2" height="20" fill="#FBC02D" />
             <rect x="4" width="2" height="20" fill="#FBC02D" />
             <rect x="8" width="2" height="20" fill="#FBC02D" />
             <rect x="0" y="-2" width="10" height="2" fill="#FBC02D" />
          </g>
          <g id="wickets-right" transform="translate(230, 80)">
             <rect width="2" height="20" fill="#FBC02D" />
             <rect x="4" width="2" height="20" fill="#FBC02D" />
             <rect x="8" width="2" height="20" fill="#FBC02D" />
             <rect x="0" y="-2" width="10" height="2" fill="#FBC02D" />
          </g>
          
          {/* Animation Styles */}
          <style>
            {`
            @keyframes bowl {
              0% { transform: translate(210px, 90px) scale(1); }
              20% { transform: translate(210px, 90px) scale(1.2); }
              100% { transform: translate(210px, 90px) scale(1); }
            }
            @keyframes hit {
              0%, 50% { transform: rotate(0deg); }
              70% { transform: rotate(-45deg); }
              100% { transform: rotate(0deg); }
            }
            @keyframes ball-fly {
              0% { opacity: 0; transform: translate(200px, 95px); }
              40% { opacity: 1; transform: translate(200px, 95px); }
              80% { opacity: 1; transform: translate(85px, 95px); }
              100% { opacity: 0; transform: translate(-50px, 50px); }
            }
            @keyframes ball-out {
               0% { opacity: 0; transform: translate(200px, 95px); }
               40% { opacity: 1; transform: translate(200px, 95px); }
               80% { opacity: 1; transform: translate(235px, 95px); }
               100% { opacity: 0; transform: translate(235px, 95px); }
            }
            @keyframes wicket-fall {
               0%, 80% { transform: translate(230px, 80px) rotate(0deg); }
               90% { transform: translate(232px, 82px) rotate(15deg); }
               100% { transform: translate(235px, 85px) rotate(25deg); opacity: 0; }
            }

            .bowler { animation: bowl 2s infinite ease-in-out; }
            .batter { animation: hit 2s infinite ease-in-out; transform-origin: 0px 0px; }
            .ball-flying { animation: ball-fly 2s infinite linear; }
            .ball-out { animation: ball-out 2s infinite linear; }
            .wickets-falling { animation: wicket-fall 2s infinite ease-out; }
            `}
          </style>
          
          {state === 'loading' && (
            <>
              {/* Bowler */}
              <circle className="bowler" r="8" fill="white" />
              {/* Batter */}
              <g className="batter" transform="translate(75, 90)">
                <circle cx="0" cy="0" r="8" fill="white" />
                <rect x="5" y="-15" width="4" height="20" fill="#8D6E63" transform="rotate(20)" />
              </g>
              {/* Ball */}
              <circle className="ball-flying" r="4" fill="red" />
            </>
          )}

          {state === 'error' && (
             <>
              {/* Bowler (static) */}
              <circle cx="210" cy="90" r="8" fill="white" />
              {/* Batter (static) */}
               <g transform="translate(75, 90)">
                <circle cx="0" cy="0" r="8" fill="white" />
                <rect x="5" y="-15" width="4" height="20" fill="#8D6E63" transform="rotate(20)" />
              </g>
              {/* Ball hitting wicket */}
              <circle className="ball-out" r="4" fill="red" />
              {/* Wickets falling */}
              <g className="wickets-falling">
                 <rect width="2" height="20" fill="#FBC02D" />
                 <rect x="4" width="2" height="20" fill="#FBC02D" />
                 <rect x="8" width="2" height="20" fill="#FBC02D" />
                 <rect x="0" y="-2" width="10" height="2" fill="#FBC02D" />
              </g>
               {/* Static left wickets */}
               <use href="#wickets-left" />
            </>
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
