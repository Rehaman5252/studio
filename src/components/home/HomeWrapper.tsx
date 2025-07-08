
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


  const handleStartQuiz = useCallback((selectedBrand: CubeBrand) => {
    if (!user && isFirebaseConfigured) {
        router.push('/auth/login?from=quiz');
        return;
    }

    if (hasPlayedInCurrentSlot) {
        router.push(`/quiz/results?review=true`);
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }
  }, [user, router, hasPlayedInCurrentSlot]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            console.log('User location access granted:', {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            console.error('Geolocation error:', error.message);
          }
        );
      } else {
        console.log('Geolocation is not supported by this browser.');
      }
      
      if ('Notification' in window && Notification.permission !== 'granted') {
          if (Notification.permission !== 'denied') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                console.log('Notification permission granted.');
                } else {
                console.log('Notification permission denied.');
                }
            });
          }
      }
    }
  }, []);

  if (isQuizStatusLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <>
      <QuizSelection onStartQuiz={handleStartQuiz} />

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
