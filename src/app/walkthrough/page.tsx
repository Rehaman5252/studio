'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface WalkthroughStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const steps: WalkthroughStep[] = [
  { id: 1, title: 'Choose Your Cricket Format', description: 'Spin the cube to select your favorite cricket format and brand partner. This affects your quiz questions and rewards!', icon: '🏏', color: 'from-green-400 to-primary' },
  { id: 2, title: 'Quick 100-Second Quizzes', description: 'Answer 5 cricket questions in 100 seconds. New quizzes start every 10 minutes with live players worldwide!', icon: '⚡', color: 'from-orange-400 to-accent' },
  { id: 3, title: 'Win Real Money & Rewards', description: 'Score 5/5 to win ₹100 instantly plus brand rewards. Get certificates and climb the leaderboard!', icon: '💰', color: 'from-yellow-400 to-yellow-600' },
  { id: 4, title: 'Smart Hint System', description: 'Use one hint per quiz to help you answer tough questions. Watch a quick ad to unlock your hint!', icon: '💡', color: 'from-purple-400 to-purple-600' },
];

export default function WalkthroughScreen() {
  const [currentStep, setCurrentStep] = useState(0);
  const router = useRouter();

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/home');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.replace('/home');
  };

  const step = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={`flex flex-col min-h-screen justify-between bg-gradient-to-br ${step.color} p-6 text-white transition-all duration-500`}>
      <header className="flex justify-between items-center">
        <h2 className="text-xl font-bold">CricBlitz Tour</h2>
        <Button variant="ghost" className="text-white hover:bg-white/20" onClick={handleSkip}>
          Skip
        </Button>
      </header>
      
      <main className="flex-1 flex flex-col justify-center items-center text-center">
        <div className="w-32 h-32 rounded-full bg-white/20 flex items-center justify-center mb-8">
          <span className="text-6xl">{step.icon}</span>
        </div>
        <h1 className="text-3xl font-extrabold mb-4">{step.title}</h1>
        <p className="max-w-md text-lg opacity-90">{step.description}</p>
      </main>

      <footer className="space-y-4">
        <Progress value={progress} className="w-full [&>div]:bg-white" />
        <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={handlePrevious} disabled={currentStep === 0} className="disabled:opacity-50 hover:bg-white/20">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
            </Button>
            <div className="flex items-center gap-2">
                {steps.map((s, index) => (
                    <button key={s.id} onClick={() => setCurrentStep(index)} className={`h-2 rounded-full transition-all ${currentStep === index ? 'w-6 bg-white' : 'w-2 bg-white/50'}`}></button>
                ))}
            </div>
            <Button onClick={handleNext} className="bg-white text-primary hover:bg-gray-200">
                {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
        </div>
      </footer>
    </div>
  );
}
