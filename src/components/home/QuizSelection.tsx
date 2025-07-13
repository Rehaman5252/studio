
'use client';

import React, { useState, useCallback, memo, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

const defaultBrand = {
    id: 1,
    brand: 'CricBlitz',
    format: 'Mixed',
    logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-transparent-png-images-icons-25.png',
    logoWidth: 80,
    logoHeight: 80,
};

function QuizSelectionComponent() {
    const { user, isProfileComplete } = useAuth();
    const { lastAttemptInSlot } = useQuizStatus();
    const router = useRouter();

    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    
    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    const handleStartQuiz = useCallback(() => {
        if (!user || !isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            router.push(`/quiz?brand=${encodeURIComponent(defaultBrand.brand)}&format=${encodeURIComponent(defaultBrand.format)}`);
        }
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot]);

    const handleSlotAlertAction = () => {
        if (lastAttemptInSlot?.reason === 'malpractice') {
            router.push(`/quiz/results?reason=malpractice`);
        } else {
            router.push(`/quiz/results?review=true`);
        }
        setShowSlotPlayedAlert(false);
    };
  
    const handleAuthAlertAction = () => {
        if (!user) {
            router.push('/auth/login');
        } else {
            router.push('/complete-profile');
        }
        setShowAuthAlert(false);
    }
    
    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Today's Challenge</h2>
                <p className="text-sm text-muted-foreground">A mixed-format quiz to test your all-round knowledge.</p>
            </div>
            
             <Card 
                className="w-full max-w-sm mx-auto mt-8 rounded-2xl shadow-xl bg-card border-2 border-primary/30 overflow-hidden"
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">{defaultBrand.format} Cricket Quiz</h3>
                            <p className="text-muted-foreground mb-2">Powered by {defaultBrand.brand}</p>
                            <p className="text-lg font-semibold text-primary">Win Rewards!</p>
                        </div>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center p-2 shadow-inner bg-white">
                            <Image
                                src={defaultBrand.logoUrl}
                                alt={`${defaultBrand.brand} logo`}
                                data-ai-hint="cricket logo"
                                width={defaultBrand.logoWidth}
                                height={defaultBrand.logoHeight}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="mt-8 space-y-8 max-w-sm mx-auto">
                <GlobalStats />

                <StartQuizButton
                  brandFormat={defaultBrand.format}
                  onClick={handleStartQuiz}
                />
            </div>

             <AlertDialog open={showSlotPlayedAlert} onOpenChange={setShowSlotPlayedAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                    {lastAttemptInSlot?.reason === 'malpractice' ? 'Slot Locked' : 'Quiz Already Attempted'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    {lastAttemptInSlot?.reason === 'malpractice'
                        ? "Malpractice was detected in your last attempt for this slot."
                        : "You have already completed a quiz in this slot."
                    }
                    <br/>
                    You can play again in the next slot.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Go Back</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSlotAlertAction}>
                    {lastAttemptInSlot?.reason === 'malpractice' ? 'View Details' : 'View Scorecard'}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                    {!user ? 'Login Required' : 'Profile Incomplete'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    {!user 
                        ? 'You need to be logged in to play a quiz.' 
                        : 'Please complete your profile to start playing quizzes and earning rewards.'
                    }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAuthAlertAction}>
                    {!user ? 'Go to Login' : 'Complete Profile'}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default memo(QuizSelectionComponent);
