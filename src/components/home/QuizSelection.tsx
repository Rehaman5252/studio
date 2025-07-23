
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

const BrandCube = dynamic(() => import('./BrandCube'), { 
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
    const { user, isProfileComplete } = useAuth();
    const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();
    const { toast } = useToast();
    
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [rotation, setRotation] = useState(faceRotations[0]);
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        // Check if the last attempt's slot ID matches the current one.
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    useEffect(() => {
        const rotationInterval = setInterval(() => {
            setCurrentFaceIndex(prevIndex => (prevIndex + 1) % faceRotations.length);
        }, 750); // Rotate to a new face every 750ms (4.5s for all 6)

        return () => clearInterval(rotationInterval);
    }, []);

    useEffect(() => {
        setRotation(faceRotations[currentFaceIndex]);
        setSelectedBrand(brandData[currentFaceIndex]);
    }, [currentFaceIndex]);


    const handleStartQuiz = useCallback(() => {
        // **Strict Slot Enforcement**
        // If an attempt for this slot exists, redirect to the results immediately.
        if (hasPlayedInCurrentSlot && lastAttemptInSlot) {
            const attemptDataString = Buffer.from(JSON.stringify(lastAttemptInSlot)).toString('base64');
            const reviewUrl = `/quiz/results?review=true&attempt=${encodeURIComponent(attemptDataString)}`;
            router.push(reviewUrl);
            toast({
                title: "Slot Already Played",
                description: "Showing your results for this slot.",
            });
            return;
        }

        if (!user) {
            router.push(`/auth/login?from=/home`);
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
            setRotation(faceRotations[clickedIndex]);
            setSelectedBrand(brandData[clickedIndex]);
            // Use a short delay to allow the cube to rotate before initiating the quiz start logic
            setTimeout(() => {
                handleStartQuiz();
            }, 150);
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
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to select and play</p>
            </div>
            
            <div className="flex justify-center items-center mt-6 mb-8 h-48 w-full">
                <BrandCube onFaceClick={handleFaceClick} rotation={rotation} />
            </div>

            <SelectedBrandCard 
                selectedBrand={selectedBrand} 
                onClick={handleBannerOrButtonClick} 
            />

            <div className="mt-8 space-y-8">
                <GlobalStats />

                <StartQuizButton
                  brandFormat={selectedBrand.format}
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
