
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

const faceIndexToRotation: { [key: number]: number } = {
    0: 0, // Front
    1: -90, // Right
    2: -180, // Back
    3: -270, // Left
    4: 90, // Top
    5: -90 // Bottom - this will rotate Y like right face
};

const QuizSelectionComponent = () => {
    const { user, isProfileComplete, isUserDataLoading } = useAuth();
    const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();

    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [isRotating, setIsRotating] = useState(true);
    
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const rotateCube = () => {
            const currentBrandIndex = brandData.findIndex(b => b.id === selectedBrand.id);
            let nextBrandIndex = currentBrandIndex;
            // Ensure we don't pick the same face twice in a row
            while (nextBrandIndex === currentBrandIndex) {
                 nextBrandIndex = Math.floor(Math.random() * 6);
            }
            
            const nextRotation = faceIndexToRotation[nextBrandIndex];
            const randomDelay = Math.random() * 1500 + 1500; // 1.5s to 3s
            
            setIsRotating(true);
            setRotation(nextRotation);
            
            // Wait for rotation animation to finish (1s) before updating brand
            setTimeout(() => {
                setSelectedBrand(brandData[nextBrandIndex]);
                setIsRotating(false);

                // Schedule next rotation
                timeoutId = setTimeout(rotateCube, randomDelay);
            }, 1000);
        };

        // Start the first rotation
        timeoutId = setTimeout(rotateCube, 1000);

        return () => clearTimeout(timeoutId);
    }, [selectedBrand]);

    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    const handleStartQuiz = useCallback(() => {
        if (isRotating) return; // Prevent starting quiz while cube is moving

        if (!user || !isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
        }
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot, selectedBrand, isRotating]);

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
            <div className="text-center mb-4">
                <h2 className="text-2xl font-bold">Select your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">The cube will decide your fate!</p>
            </div>
            
            <div className="flex justify-center items-center my-10 h-48 w-48 mx-auto transition-transform duration-300 hover:scale-105">
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
                  isDisabled={isRotating}
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
