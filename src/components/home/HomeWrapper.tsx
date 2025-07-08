
'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { CubeBrand } from '@/components/Cube';
import { useAuth } from '@/context/AuthProvider';
import { isFirebaseConfigured } from '@/lib/firebase';
import QuizSelection from './QuizSelection';
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
import { Button } from '@/components/ui/button';


const MANDATORY_PROFILE_FIELDS = [
    'name', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export default function HomeWrapper() {
  const { user, userData } = useAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, isQuizStatusLoading]);

  // Check for profile completion
  useEffect(() => {
    // We only want to run this check once the user data is loaded.
    if (user && userData) {
      const completedFields = MANDATORY_PROFILE_FIELDS.filter(field => !!userData[field]);
      if (completedFields.length < MANDATORY_PROFILE_FIELDS.length) {
        setShowProfilePrompt(true);
      }
    }
  }, [user, userData]);

  // Restore Notification and Geolocation permission prompts
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    if ('geolocation' in navigator) {
      // This will prompt the user for permission if not already granted/denied.
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        if (result.state === 'prompt') {
            navigator.geolocation.getCurrentPosition(() => {}, () => {}, {});
        }
      });
    }
  }, []);


  const handleStartQuiz = useCallback((selectedBrand: CubeBrand) => {
    if (!user && isFirebaseConfigured) {
        router.push('/auth/login?from=quiz');
        return;
    }

    if (hasPlayedInCurrentSlot) {
        setShowSlotPlayedAlert(true);
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }
  }, [user, router, hasPlayedInCurrentSlot]);

  const handleSlotAlertAction = () => {
    if (lastAttemptInSlot?.reason === 'malpractice') {
        router.push(`/quiz/results?reason=malpractice`);
    } else {
        router.push(`/quiz/results?review=true`);
    }
    setShowSlotPlayedAlert(false);
  };

  if (isQuizStatusLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <QuizSelection
        onStartQuiz={handleStartQuiz}
      />

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

      <AlertDialog open={showProfilePrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Please Complete Your Profile</AlertDialogTitle>
            <AlertDialogDescription>
              To provide the best experience and enable all features, including payouts, we require all profile fields to be completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={() => router.push('/profile')}>Go to Profile</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
