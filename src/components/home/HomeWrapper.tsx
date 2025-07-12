
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { CubeBrand } from '@/components/Cube';
import { useAuth } from '@/context/AuthProvider';
import QuizSelector from '@/components/home/QuizSelector';
import GlobalStats from '@/components/home/GlobalStats';
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
import { brands } from '@/components/home/brandData';


export default function HomeWrapper() {
  const { user, isProfileComplete, isUserDataLoading } = useAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();
  
  const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
  const [showAuthAlert, setShowAuthAlert] = useState(false);
  const [visibleFaceIndex, setVisibleFaceIndex] = useState(0);

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (!user || isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [user, lastAttemptInSlot, isQuizStatusLoading]);

  const handleFaceClick = useCallback((index: number) => {
    const selectedBrand = brands[index];
    if (!user || !isProfileComplete) {
        setShowAuthAlert(true);
        return;
    }
    if (hasPlayedInCurrentSlot) {
        setShowSlotPlayedAlert(true);
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
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

  if (isQuizStatusLoading || isUserDataLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <div className="animate-fade-in-up">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to play!</p>
            </div>
            
            <QuizSelector 
                brands={brands}
                onFaceClick={handleFaceClick}
                visibleFaceIndex={visibleFaceIndex}
                setVisibleFaceIndex={setVisibleFaceIndex}
            />

            <div className="mt-8 space-y-8">
                <GlobalStats />
            </div>
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
}
