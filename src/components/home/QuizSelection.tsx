
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

const faceIndexToRotation: { [key: number]: { x: number; y: number } } = {
    0: { x: 0, y: 0 },      // Front
    1: { x: 0, y: -90 },     // Right
    2: { x: 0, y: -180 },    // Back
    3: { x: 0, y: 90 },     // Left
    4: { x: -90, y: 0 },    // Top
    5: { x: 90, y: 0 },     // Bottom
};

const QuizSelectionComponent = () => {
    const { user, isProfileComplete, isUserDataLoading } = useAuth();
    const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();

    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isChanging, setIsChanging] = useState(false);
    
    useEffect(() => {
        const intervalId = setInterval(() => {
            setIsChanging(true);
            
            // Select a new random brand that is different from the current one
            let nextBrandIndex;
            const currentBrandIndex = brandData.findIndex(b => b.id === selectedBrand.id);
            do {
                nextBrandIndex = Math.floor(Math.random() * 6);
            } while (nextBrandIndex === currentBrandIndex);

            const nextRotation = faceIndexToRotation[nextBrandIndex];
            
            // Set the rotation
            setRotation(nextRotation);

            // After the rotation animation starts, update the brand and re-enable the button
            setTimeout(() => {
                setSelectedBrand(brandData[nextBrandIndex]);
                setIsChanging(false);
            }, 250); // A small delay to allow the state to update

        }, 500);

        return () => clearInterval(intervalId);
    }, [selectedBrand]);


    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    const handleStartQuiz = useCallback(() => {
        if (isChanging) return; 

        if (!user || !isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
        }
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot, selectedBrand, isChanging]);

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
                <p className="text-sm text-muted-foreground">click the face of cube to play</p>
            </div>
            
            <div className="flex justify-center items-center my-12 h-48 w-48 mx-auto transition-transform duration-300 hover:scale-105">
                <BrandCube rotation={rotation} />
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
                  isDisabled={isChanging}
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
