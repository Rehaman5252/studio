
'use client';

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Home, Zap, Award, BarChart3, Gift, Lightbulb } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';

const tourSteps = [
  {
    icon: Home,
    title: 'Welcome to CricBlitz!',
    description: 'The ultimate cricket quiz where knowledge meets rewards. Ready to start your innings?',
  },
  {
    icon: Zap,
    title: 'Interactive Format Selection',
    description: 'Spin the 3D cube on the home screen to pick your favorite cricket format—T20, ODI, Test, and more!',
  },
  {
    icon: Award,
    title: 'Race Against the Clock',
    description: 'Each quiz is a fast-paced challenge. Answer quickly and accurately to climb the leaderboard.',
  },
  {
    icon: Lightbulb,
    title: 'AI-Powered Hints',
    description: 'Stuck on a tricky question? Use our smart hint system for a clue. It might just be the help you need!',
  },
  {
    icon: BarChart3,
    title: 'Live Leaderboards',
    description: 'Compete in real-time! See how you stack up against other fans in daily, weekly, and monthly rankings.',
  },
  {
    icon: Gift,
    title: 'Win Real Rewards',
    description: "Score high to earn scratch cards from top brands and other exciting offers in the Rewards Center.",
  },
];

const WalkthroughPage = () => {
  const [step, setStep] = useState(0);
  const router = useRouter();
  const { userData, updateUserData } = useAuth();
  
  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    if (updateUserData) {
      updateUserData({ guidedTourCompleted: true });
    }
    router.replace('/home');
  };
  
  // This is a failsafe. If a user has completed the tour and somehow lands here,
  // or if the userData is slow to load, we don't want them stuck.
  useEffect(() => {
    if (userData?.guidedTourCompleted) {
      router.replace('/home');
    }
  }, [userData, router]);


  const currentStep = tourSteps[step];
  const Icon = currentStep.icon;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -30 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="flex flex-col items-center justify-center text-center flex-grow"
        >
          <div className="bg-primary/20 p-6 rounded-full mb-8">
            <Icon className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold mb-4">{currentStep.title}</h1>
          <p className="max-w-md text-muted-foreground">{currentStep.description}</p>
        </motion.div>
      </AnimatePresence>

      <div className="py-4">
        <div className="flex justify-center gap-2 mb-8">
          {tourSteps.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-500 ${
                i === step ? 'w-6 bg-primary' : 'w-2 bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={finishTour}
            className="flex-1"
            disabled={step === tourSteps.length -1}
          >
            {step < tourSteps.length - 1 ? 'Skip' : ''}
          </Button>
          <Button onClick={handleNext} className="flex-1">
            {step < tourSteps.length - 1 ? 'Next' : "Let's Play!"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default WalkthroughPage;
