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
            <div>
                <p className="text-lg">Win ₹100 in just 100 seconds!</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Play live cricket quizzes every 10 minutes.</li>
                    <li>Compete, rank, and earn real cash.</li>
                </ul>
            </div>
        ),
        disableBeacon: true,
    },
    {
        target: '#tour-step-cube',
        title: 'Choose Your Game Format',
        content: 'Tap any side of the cube (T20, ODI, Test, IPL, etc.) to start your quiz. Each face is linked with a brand sponsor!',
        placement: 'bottom',
    },
    {
        target: '#tour-step-start-quiz',
        title: 'Start Your Quiz!',
        content: "You’ll get 5 Questions, with only 100 seconds total. Play smart, play fast, and win real cash! Remember, you get one attempt per slot – so choose wisely.",
        placement: 'bottom',
    },
    {
        target: '#tour-step-leaderboard',
        title: 'Track Your Progress',
        content: 'After each quiz, see your scorecard and check the Leaderboard to see how you rank against other players.',
        placement: 'top',
    },
    {
        target: '#tour-step-rewards',
        title: 'Claim Your Rewards',
        content: 'Tap here to see the cashback, scratch cards & offers you’ve earned. Score a perfect 5/5 to win ₹100!',
        placement: 'top',
    },
    {
        target: '#tour-step-profile',
        title: 'Personalize Your Game',
        content: 'View your name, photo, rewards, and performance history here. You’re ready to become a quiz champ!',
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
