
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

const faceRotations = [
    { x: 0, y: 0 },    // Front
    { x: 0, y: -90 },  // Right
    { x: 0, y: -180 }, // Back
    { x: 0, y: 90 },   // Left
    { x: -90, y: 0 },  // Top
    { x: 90, y: 0 }    // Bottom
];

const QuizSelectionComponent = () => {
    const { user, isProfileComplete, isUserDataLoading } = useAuth();
    const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();
    
    const [selectedBrand, setSelectedBrand] = useState<CubeBrand>(brandData[0]);
    const [rotation, setRotation] = useState({ x: 0, y: 0 });
    const [isChanging, setIsChanging] = useState(false);
    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);

    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    const handleStartQuiz = useCallback((brandToStart: CubeBrand) => {
        if (!user || !isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            router.push(`/quiz?brand=${encodeURIComponent(brandToStart.brand)}&format=${encodeURIComponent(brandToStart.format)}`);
        }
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot]);
    
    const handleSelectBrand = useCallback((brand: CubeBrand) => {
        if (isChanging) return;
        setIsChanging(true);

        const brandIndex = brandData.findIndex(b => b.id === brand.id);
        if (brandIndex !== -1) {
            setRotation(faceRotations[brandIndex]);
            setSelectedBrand(brand);
        }
        setTimeout(() => setIsChanging(false), 500);
    }, [isChanging]);

    const handleFaceClick = (brand: CubeBrand) => {
        handleStartQuiz(brand);
    };

    const handleBannerOrButtonClick = () => {
        handleStartQuiz(selectedBrand);
    };

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const setRandomRotation = () => {
            if (isChanging) return;
        
            setIsChanging(true);
            const randomIndex = Math.floor(Math.random() * brandData.length);
            const newBrand = brandData[randomIndex];
            const newRotation = faceRotations[randomIndex];
            
            setRotation(newRotation);
            setSelectedBrand(newBrand);

            setTimeout(() => {
                setIsChanging(false);
            }, 500);
            
            const randomDelay = Math.random() * 1000 + 500; // 0.5 to 1.5 seconds
            timeoutId = setTimeout(setRandomRotation, randomDelay);
        };
        
        const randomDelay = Math.random() * 1000 + 500;
        timeoutId = setTimeout(setRandomRotation, randomDelay);

        return () => clearTimeout(timeoutId);
    }, [isChanging]);

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
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to select and play</p>
            </div>
            
            <div className="flex justify-center items-center mt-6 mb-8 h-48 w-full transition-transform duration-300 hover:scale-105">
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
