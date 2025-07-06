
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Home, Dices, BrainCircuit, Trophy, User, ArrowRight, ArrowLeft } from 'lucide-react';

interface TourStep {
  icon: React.ElementType;
  title: string;
  content: React.ReactNode;
}

const tourSteps: TourStep[] = [
  {
    icon: Home,
    title: 'Home Page',
    content: (
      <ul className="list-disc space-y-2 pl-5">
        <li>This is your main dashboard.</li>
        <li>It shows the countdown to the next live quiz, the leaderboard, and rewards.</li>
        <li>➡️ Tap <span className="font-semibold text-primary">"Start Quiz"</span> when you're ready!</li>
      </ul>
    ),
  },
  {
    icon: Dices,
    title: 'Choose Your Format',
    content: (
       <ul className="list-disc space-y-2 pl-5">
        <li>Rotate the <span className="font-semibold text-primary">3D Cube</span> or use the banner.</li>
        <li>Choose a format like IPL, T20, or Test.</li>
        <li>Tapping starts the quiz for that format.</li>
        <li className="font-bold">🎯 Remember: You can only attempt one quiz per time slot.</li>
      </ul>
    ),
  },
  {
    icon: BrainCircuit,
    title: 'Quiz Time!',
    content: (
       <ul className="list-disc space-y-2 pl-5">
        <li>You’ll get <span className="font-semibold text-primary">5 questions</span>.</li>
        <li>You have <span className="font-semibold text-primary">20 seconds</span> per question.</li>
        <li>Use <span className="font-semibold text-primary">1 hint</span> per quiz by watching a short ad.</li>
        <li>⚠️ Ads will appear between Q3 & Q4, and after the quiz for rewards.</li>
      </ul>
    ),
  },
  {
    icon: Trophy,
    title: 'Leaderboard & Rewards',
    content: (
       <ul className="list-disc space-y-2 pl-5">
        <li>After each quiz, see your Scorecard.</li>
        <li>View your rank on the Leaderboard.</li>
        <li>Tap <span className="font-semibold text-primary">“Rewards”</span> to see cashback, scratch cards & offers.</li>
        <li className="font-bold text-primary">💸 Get ₹100 for a perfect score!</li>
      </ul>
    ),
  },
   {
    icon: User,
    title: 'Profile & History',
    content: (
       <ul className="list-disc space-y-2 pl-5">
        <li>Tap the <span className="font-semibold text-primary">Profile icon</span> on the bottom navigation bar.</li>
        <li>View your quiz history, scores, and attempts.</li>
        <li>See your total rewards earned.</li>
        <li>Customize or update your details.</li>
      </ul>
    ),
  },
];

interface GuidedTourProps {
  open: boolean;
  onFinish: () => void;
}

export default function GuidedTour({ open, onFinish }: GuidedTourProps) {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < tourSteps.length - 1) {
      setStep(step + 1);
    } else {
      onFinish();
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const currentStep = tourSteps[step];

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onFinish()}>
      <DialogContent className="sm:max-w-[425px] bg-background text-foreground" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center">
            <div className="mx-auto bg-primary/20 p-3 rounded-full w-fit mb-2">
                 <currentStep.icon className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-left text-muted-foreground">
            {currentStep.content}
        </div>
        <DialogFooter className="flex-row justify-between items-center w-full">
            <div className="text-sm text-muted-foreground">
                Step {step + 1} of {tourSteps.length}
            </div>
            <div className="flex gap-2">
                {step > 0 && (
                    <Button variant="outline" onClick={handlePrev}>
                        <ArrowLeft className="mr-2" />
                        Previous
                    </Button>
                )}
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
                    {step === tourSteps.length - 1 ? 'Finish' : 'Next'}
                    {step < tourSteps.length - 1 && <ArrowRight className="ml-2" />}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
