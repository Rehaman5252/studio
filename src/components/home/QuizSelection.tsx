
'use client';

import React, { useState, useCallback, memo, useMemo, useEffect } from 'react';
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
import { Loader2 } from 'lucide-react';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import { brandData, type CubeBrand } from './brandData';
import BrandCube from './BrandCube';

const QuizSelectionComponent = () => {
    const { user, isProfileComplete, isUserDataLoading } = useAuth();
    const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();

    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    
    const handleStartQuiz = useCallback(() => {
        if (!user || !isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
        }
    }, [router, user, isProfileComplete, lastAttemptInSlot, selectedBrand]);
    
    const handleSelectBrand = useCallback((brand: CubeBrand) => {
        setSelectedBrand(brand);
    }, []);

    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);


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
    
    if (isUserDataLoading || isQuizStatusLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <>
            <div className="text-center mb-8 -mt-8">
                <h2 className="text-2xl font-bold">Select your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Hover to pause, click a face to play</p>
            </div>
            
            <div className="flex justify-center items-center mt-20 mb-12 h-48 w-full transition-transform duration-300 hover:scale-105">
                <BrandCube onFaceClick={handleSelectBrand} onQuizStart={handleStartQuiz} />
            </div>

            <SelectedBrandCard 
                selectedBrand={selectedBrand} 
                onClick={handleStartQuiz} 
            />

            <div className="mt-8 space-y-8">
                <GlobalStats />

                <StartQuizButton
                  brandFormat={selectedBrand.format}
                  onClick={handleStartQuiz}
                />
            </div>

             <AlertDialog open={showSlotPlayedAlert} onOpenChange={setShowSlotPlayedAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                    {lastAttemptInSlot?.reason === 'malpractice' ? 'Slot Locked: Unfair Play' : 'Quiz Already Attempted'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    {lastAttemptInSlot?.reason === 'malpractice'
                        ? "Your previous attempt in this slot was terminated due to unfair play (like switching tabs). Please try again in the next slot."
                        : "You have already completed a quiz in this 10-minute slot. You can play again in the next one!"
                    }
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
