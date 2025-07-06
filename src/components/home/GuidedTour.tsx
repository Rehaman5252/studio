'use client';

import React from 'react';
import Joyride, { type CallBackProps, type Step, EVENTS } from 'react-joyride';

interface GuidedTourProps {
  run: boolean;
  onFinish: () => void;
}

const tourSteps: Step[] = [
    {
        target: 'body',
        placement: 'center',
        title: 'Welcome to IndCric!',
        content: (
            <div className="text-center">
                <p className="text-lg font-bold">“Win ₹100 in just 100 seconds!”</p>
                <ul className="list-none mt-3 space-y-2 text-left">
                    <li>⚡ Play live cricket quizzes every 10 minutes</li>
                    <li>🎯 Compete, rank, and earn real cash.</li>
                </ul>
            </div>
        ),
        disableBeacon: true,
    },
    {
        target: '#tour-step-cube',
        title: 'Select Your Game Format',
        content: (
            <div>
                <p>Tap any side of the cube (T20, ODI, Test, IPL, etc.) to start your quiz. Each face is linked with a brand sponsor!</p>
                <p className="mt-4 font-semibold text-primary">🟩 “Tap to begin – it’s LIVE!”</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '#tour-step-start-quiz',
        title: 'Start Your Quiz!',
        content: (
            <div>
                <p>You’ll get <strong>5 Questions</strong> & ⏱️ <strong>100 seconds only</strong>.</p>
                <p>Play smart, fast, and win real ₹!</p>
                <p className="mt-4 text-muted-foreground text-sm">📌 One attempt per slot – so choose wisely.</p>
            </div>
        ),
        placement: 'bottom',
    },
    {
        target: '#tour-step-leaderboard',
        title: 'Track Your Progress',
        content: (
            <div>
                <p>🏅 <strong>Leaderboard</strong>: See how you rank against others.</p>
                <p className="mt-2">🎁 <strong>Rewards</strong>: Claim cash if you score 100/100!</p>
                <p className="mt-4 font-semibold text-primary">📢 ₹100 reward if you're perfect. Go for it!</p>
            </div>
        ),
        placement: 'top',
    },
    {
        target: '#tour-step-profile',
        title: 'Personalize Your Game',
        content: (
            <div>
                <p>View your name, photo, rewards, and performance history.</p>
                <p className="mt-4 text-xl">🎉 You’re ready to become a quiz champ!</p>
            </div>
        ),
        placement: 'top',
    }
];


export default function GuidedTour({ run, onFinish }: GuidedTourProps) {

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [EVENTS.FINISHED, EVENTS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={tourSteps}
      styles={{
        options: {
          arrowColor: 'hsl(var(--card))',
          backgroundColor: 'hsl(var(--card))',
          primaryColor: 'hsl(var(--primary))',
          textColor: 'hsl(var(--foreground))',
          zIndex: 1000,
        },
        tooltip: {
            border: '1px solid hsl(var(--border))',
            borderRadius: 'var(--radius)',
            padding: '1rem',
        },
        buttonNext: {
            borderRadius: 'calc(var(--radius) - 4px)',
        },
        buttonBack: {
            borderRadius: 'calc(var(--radius) - 4px)',
        },
      }}
    />
  );
}
