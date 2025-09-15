
'use client';

import React, { useEffect } from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { useTheme } from 'next-themes';

interface GuidedTourProps {
  run: boolean;
  onFinish: () => void;
}

const steps: Step[] = [
  {
    target: '#tour-step-1',
    content: 'Welcome to CricBlitz! This is the main screen where you can select a quiz format. The cube will rotate through different formats.',
    disableBeacon: true,
  },
  {
    target: '#tour-step-2',
    content: 'Here you can see live stats about the game, including when the next quiz starts, how many people are playing, and today\'s winners.',
  },
  {
    target: '#tour-step-3',
    content: 'The navigation bar at the bottom helps you move around the app. Check out the Leaderboard to see top players!',
    placement: 'top',
  },
];

export default function GuidedTour({ run, onFinish }: GuidedTourProps) {
  const { resolvedTheme } = useTheme();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };

  if (!run) {
    return null;
  }
  
  return (
    <Joyride
      run={run}
      steps={steps}
      continuous
      showProgress
      showSkipButton
      callback={handleJoyrideCallback}
      styles={{
        options: {
          arrowColor: resolvedTheme === 'dark' ? 'hsl(var(--card))' : '#FFFFFF',
          backgroundColor: resolvedTheme === 'dark' ? 'hsl(var(--card))' : '#FFFFFF',
          primaryColor: 'hsl(var(--primary))',
          textColor: resolvedTheme === 'dark' ? 'hsl(var(--card-foreground))' : '#111827',
          zIndex: 1000,
        },
      }}
    />
  );
}
