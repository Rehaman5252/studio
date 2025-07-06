'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
    Home, Dices, BrainCircuit, Trophy, User, ArrowRight, ArrowLeft,
    Clock, CheckCircle, Gift, BarChart, History, Pencil, Lightbulb
} from 'lucide-react';

// A helper component for list items in the tour
const TourListItem = ({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) => (
    <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full mt-1">
            <Icon className="w-5 h-5 text-primary" />
        </div>
        <div>
            <p className="font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
        </div>
    </div>
);


interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  content: React.ReactNode;
  image: string;
  imageHint: string;
}

const tourSteps: TourStep[] = [
  {
    icon: Home,
    title: 'Welcome to CricBlitz!',
    description: 'Your main dashboard for all things cricket quiz.',
    content: (
        <div className="space-y-4">
            <TourListItem icon={Clock} title="Live Countdown" description="Shows the time until the next quiz begins." />
            <TourListItem icon={BarChart} title="Leaderboard" description="See who's at the top of their game." />
            <TourListItem icon={Gift} title="Rewards & Offers" description="Check out the prizes you can win." />
        </div>
    ),
    image: 'https://placehold.co/400x200.png',
    imageHint: 'dashboard screen'
  },
  {
    icon: Dices,
    title: 'Choose Your Format',
    description: 'Select a format to test your knowledge.',
    content: (
       <div className="space-y-4">
           <TourListItem icon={Dices} title="3D Cube Selection" description="Rotate the cube to pick a quiz format." />
           <TourListItem icon={CheckCircle} title="One Shot Per Slot" description="You can only attempt one quiz per 10-minute slot." />
       </div>
    ),
    image: 'https://placehold.co/400x200.png',
    imageHint: '3d cube'
  },
  {
    icon: BrainCircuit,
    title: 'Take the Quiz',
    description: "It's time to prove your expertise.",
    content: (
        <div className="space-y-4">
           <TourListItem icon={BrainCircuit} title="5 Challenging Questions" description="Designed to test the true cricket expert." />
           <TourListItem icon={Clock} title="20 Seconds Per Question" description="Think fast, the clock is ticking!" />
           <TourListItem icon={Lightbulb} title="AI-Powered Hints" description="Stuck? Watch a short ad to get a helpful clue." />
        </div>
    ),
    image: 'https://placehold.co/400x200.png',
    imageHint: 'quiz interface'
  },
  {
    icon: Trophy,
    title: 'Climb & Win',
    description: 'See your results and claim your rewards.',
    content: (
       <div className="space-y-4">
           <TourListItem icon={Trophy} title="Instant Scorecard" description="Review your performance right after the quiz." />
           <TourListItem icon={BarChart} title="Live Leaderboard" description="See where you rank against other players." />
           <TourListItem icon={Gift} title="Win Real Rewards" description="Score a perfect 5/5 to win real prizes!" />
       </div>
    ),
    image: 'https://placehold.co/400x200.png',
    imageHint: 'trophy award'
  },
   {
    icon: User,
    title: 'Manage Your Profile',
    description: 'Your personal cricket hub.',
    content: (
        <div className="space-y-4">
           <TourListItem icon={History} title="Quiz History" description="Review your past attempts and scores." />
           <TourListItem icon={Gift} title="Rewards Center" description="Access your earned scratch cards and offers." />
           <TourListItem icon={Pencil} title="Update Your Details" description="Keep your profile information current." />
        </div>
    ),
    image: 'https://placehold.co/400x200.png',
    imageHint: 'profile page'
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
  const progress = ((step + 1) / tourSteps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onFinish()}>
      <DialogContent className="sm:max-w-md bg-background text-foreground p-0 overflow-hidden" onInteractOutside={(e) => e.preventDefault()}>
        <div className="relative h-48 w-full">
            <Image 
                src={currentStep.image}
                alt={currentStep.title}
                width={400}
                height={200}
                className="object-cover w-full h-full"
                data-ai-hint={currentStep.imageHint}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="p-6 pt-2 space-y-4 -mt-16">
            <div className="text-center relative">
                <div className="mx-auto bg-background border-4 border-background p-3 rounded-full w-fit mb-2 shadow-lg">
                    <currentStep.icon className="h-8 w-8 text-primary" />
                </div>
                <DialogHeader>
                    <DialogTitle className="text-2xl">{currentStep.title}</DialogTitle>
                    <DialogDescription>{currentStep.description}</DialogDescription>
                </DialogHeader>
            </div>
            
            <div className="text-muted-foreground pt-2">
                {currentStep.content}
            </div>
        </div>

        <DialogFooter className="flex-col items-center bg-muted/50 p-4 border-t">
            <Progress value={progress} className="w-full mb-4 h-1.5" />
            <div className="flex justify-between items-center w-full">
                {step > 0 ? (
                    <Button variant="ghost" onClick={handlePrev} size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                    </Button>
                ) : <div />}
                <Button onClick={handleNext} className="bg-primary hover:bg-primary/90">
                    {step === tourSteps.length - 1 ? 'Get Started' : 'Next'}
                    {step < tourSteps.length - 1 && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
