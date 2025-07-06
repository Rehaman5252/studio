'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { CubeBrand } from '@/components/Cube';
import { useAuth } from '@/context/AuthProvider';
import { isFirebaseConfigured } from '@/lib/firebase';
import GuidedTour from './GuidedTour';
import QuizSelection from './QuizSelection';


export default function HomeWrapper() {
  const { user } = useAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();
  const [showTour, setShowTour] = useState(false);

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, isQuizStatusLoading]);

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
      const tourCompleted = localStorage.getItem('indcric_guided_tour_completed');
      if (!tourCompleted) {
          setShowTour(true);
      }
      
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

  const handleFinishTour = () => {
      if (typeof window !== 'undefined') {
          localStorage.setItem('indcric_guided_tour_completed', 'true');
          setShowTour(false);
      }
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
      <GuidedTour open={showTour} onFinish={handleFinishTour} />
      <QuizSelection onStartQuiz={handleStartQuiz} />
    </>
  );
}
