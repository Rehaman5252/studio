
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
import { Loader2 } from 'lucide-react';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import { brandData, type CubeBrand } from './brandData';
import BrandCube from './BrandCube';
import Link from 'next/link';
import { Button } from '../ui/button';

const faceRotations = [
    { x: 0, y: 0 },    // Front (Mixed)
    { x: 0, y: -90 },  // Right (IPL)
    { x: 0, y: -180 }, // Back (T20)
    { x: 0, y: 90 },   // Left (ODI)
    { x: -90, y: 0 },  // Top (WPL)
    { x: 90, y: 0 }    // Bottom (Test)
];

const QuizSelectionComponent = () => {
    const { user, profile } = useAuth();
    const { lastAttemptInSlot, isLoading: isQuizStatusLoading, timeLeft } = useQuizStatus();
    const router = useRouter();
    
    const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [rotation, setRotation] = useState(faceRotations[0]);
    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    const isProfileComplete = useMemo(() => !!profile?.profileCompleted, [profile]);
    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    useEffect(() => {
        const rotationInterval = setInterval(() => {
            setCurrentFaceIndex(prevIndex => (prevIndex + 1) % faceRotations.length);
        }, 3000);

        return () => clearInterval(rotationInterval);
    }, []);

    useEffect(() => {
        setRotation(faceRotations[currentFaceIndex]);
        setSelectedBrand(brandData[currentFaceIndex]);
    }, [currentFaceIndex]);

    const handleStartQuiz = useCallback((brandToStart: CubeBrand) => {
        if (!user) {
            setShowAuthAlert(true);
            return;
        }
        if (!isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            router.push(`/quiz?brand=${encodeURIComponent(brandToStart.brand)}&format=${encodeURIComponent(brandToStart.format)}`);
        }
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot]);

    const handleFaceClick = (brand: CubeBrand) => {
        const clickedIndex = brandData.findIndex(b => b.id === brand.id);
        if (clickedIndex !== -1) {
            setCurrentFaceIndex(clickedIndex);
            handleStartQuiz(brand);
        }
    };

    const handleBannerOrButtonClick = () => {
        handleStartQuiz(selectedBrand);
    };

    const handleAuthAlertAction = () => {
        setShowAuthAlert(false);
        if (!user) {
            router.push('/auth/login?from=/home');
        } else {
            router.push('/complete-profile');
        }
    };
    
    if (isQuizStatusLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        )
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
                            ? "Your previous attempt was terminated for unfair play. You can try again in the next slot."
                            : "You have already played in this 10-minute slot."
                        }
                        <br />
                        The next quiz will be available in {timeLeft.minutes}m {timeLeft.seconds}s.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction onClick={() => setShowSlotPlayedAlert(false)}>OK</AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            {!user ? 'Login to Play' : 'Complete Your Profile'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            {!user 
                                ? 'You need to be logged in to play quizzes and win rewards.' 
                                : 'Please complete your profile to start playing. It helps us personalize your experience and manage payouts.'
                            }
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleAuthAlertAction}>
                            {!user ? 'Login / Sign Up' : 'Complete Profile'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default memo(QuizSelectionComponent);
