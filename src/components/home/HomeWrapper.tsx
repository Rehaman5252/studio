'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { CubeBrand } from '@/components/Cube';
import { useAuth } from '@/context/AuthProvider';
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

export default function HomeWrapper() {
  const { isUserDataLoading } = useAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();
  const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, isQuizStatusLoading]);

  const handleStartQuiz = useCallback((selectedBrand: CubeBrand) => {
    if (hasPlayedInCurrentSlot) {
        setShowSlotPlayedAlert(true);
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }
  }, [router, hasPlayedInCurrentSlot]);

  const handleSlotAlertAction = () => {
    if (lastAttemptInSlot?.reason === 'malpractice') {
        router.push(`/quiz/results?reason=malpractice`);
    } else {
        router.push(`/quiz/results?review=true`);
    }
    setShowSlotPlayedAlert(false);
  };

  if (isQuizStatusLoading || isUserDataLoading) {
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
    </>
  );
}
