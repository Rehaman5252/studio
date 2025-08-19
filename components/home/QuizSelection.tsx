
'use client';

import React, { useState, useCallback, memo, useEffect, useMemo } from 'react';
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
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import { brandData, type CubeBrand } from '@/components/home/brandData';
import dynamic from 'next/dynamic';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';

const BrandCube = dynamic(() => import('@/components/home/BrandCube'), { 
    loading: () => <Skeleton className="w-48 h-48 rounded-lg" />,
    ssr: false 
});

const faceRotations = [
    { x: 0, y: 0 },    // Front (Mixed)
    { x: 0, y: -90 },  // Right (IPL)
    { x: 0, y: -180 }, // Back (T20)
    { x: 0, y: 90 },   // Left (ODI)
    { x: -90, y: 0 },  // Top (WPL)
    { x: 90, y: 0 }    // Bottom (Test)
];

const QuizSelectionComponent = () => {
    const { user, isProfileComplete, lastAttemptInSlot } = useAuth();
    const { isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();
    const { toast } = useToast();
    
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [rotation, setRotation] = useState(faceRotations[0]);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    
    // Performance Optimization: Prefetch quiz questions
    useEffect(() => {
        const prefetchQuiz = async () => {
            try {
                // We don't need the result, just warming up the API route
                 fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ format: 'Mixed', userId: 'prefetch-user' }),
                });
            } catch (e) {
                // Prefetching is best-effort, so we don't show errors
                console.warn("Quiz prefetching failed in background:", e);
            }
        };
        // Prefetch immediately on component mount
        prefetchQuiz();
    }, []);

    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        // Check if the last attempt's slot ID matches the current one.
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    useEffect(() => {
        const rotationInterval = setInterval(() => {
            setCurrentFaceIndex(prevIndex => {
                const newIndex = (prevIndex + 1) % faceRotations.length;
                setRotation(faceRotations[newIndex]);
                setSelectedBrand(brandData[newIndex]);
                return newIndex;
            });
        }, 750); // 4500ms / 6 faces = 750ms per face

        return () => clearInterval(rotationInterval);
    }, []);

    const handleStartQuiz = useCallback(() => {
        if (!user) {
            router.push(`/auth/login?from=/home`);
            return;
        }
        
        // **Strict Slot Enforcement**
        // If an attempt for this slot exists, redirect to the results immediately.
        if (hasPlayedInCurrentSlot && lastAttemptInSlot) {
            const attemptDataString = btoa(JSON.stringify(lastAttemptInSlot));
            const reviewUrl = `/quiz/results?review=true&attempt=${encodeURIComponent(attemptDataString)}`;
            router.push(reviewUrl);
            toast({
                title: "Slot Already Played",
                description: `Showing your results for the ${lastAttemptInSlot.format} quiz.`,
            });
            return;
        }

        if (!user.emailVerified) {
            toast({
                title: "Email not verified",
                description: "Please verify your email address before playing a quiz.",
                variant: "destructive"
            });
            return;
        }
        if (!isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot, lastAttemptInSlot, selectedBrand, toast]);
    

    const handleFaceClick = (brand: CubeBrand) => {
        const clickedIndex = brandData.findIndex(b => b.id === brand.id);
        if (clickedIndex !== -1) {
            setCurrentFaceIndex(clickedIndex)
            setRotation(faceRotations[clickedIndex]);
            setSelectedBrand(brandData[clickedIndex]);
            // Use a short delay to allow the cube to rotate before initiating the quiz start logic
            // This is removed to make the click feel instant
            handleStartQuiz();
        }
    };

    const handleBannerOrButtonClick = () => {
        handleStartQuiz();
    };
  
    const handleAuthAlertAction = () => {
        if (!user) {
            router.push('/auth/login?from=/home');
        } else {
            router.push('/complete-profile');
        }
        setShowAuthAlert(false);
    }
    
    return (
        <>
            <div className="text-center mb-8" id="tour-step-1">
                <h2 className="text-2xl font-bold">Select Your Quiz Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to select and play</p>
            </div>
            
            <div className="flex justify-center items-center mt-20 mb-8 h-48 w-full">
                <BrandCube onFaceClick={handleFaceClick} rotation={rotation} />
            </div>

            <SelectedBrandCard 
                selectedBrand={selectedBrand} 
                onClick={handleBannerOrButtonClick} 
            />

            <div className="mt-8 space-y-8" id="tour-step-2">
                <GlobalStats />

                <StartQuizButton
                  brandFormat={hasPlayedInCurrentSlot ? lastAttemptInSlot!.format : selectedBrand.format}
                  onClick={handleBannerOrButtonClick}
                  isDisabled={isQuizStatusLoading}
                  hasPlayed={hasPlayedInCurrentSlot}
                />
            </div>
            
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
