
'use client';

import React, { useEffect } from 'react';
import Joyride, { Step, CallBackProps } from 'react-joyride';
import { useTheme } from 'next-themes';
import { useAuth } from '@/context/AuthProvider';

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
  const { theme } = useTheme();

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = ['finished', 'skipped'];

    if (finishedStatuses.includes(status)) {
      onFinish();
    }
  };
  
  // This is a failsafe in case Joyride doesn't fire its callback properly.
  useEffect(() => {
    if (!run) {
        onFinish();
    }
  }, [run, onFinish])

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
          arrowColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
          backgroundColor: theme === 'dark' ? '#1E293B' : '#FFFFFF',
          primaryColor: '#228B22', // Forest Green
          textColor: theme === 'dark' ? '#FFFFFF' : '#0F172A',
          zIndex: 1000,
        },
      }}
    />
  );
}
