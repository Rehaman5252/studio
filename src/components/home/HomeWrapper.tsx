'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { CubeBrand } from '@/components/Cube';
import { useAuth } from '@/context/AuthProvider';
import { isFirebaseConfigured } from '@/lib/firebase';
import QuizSelector from '@/components/home/QuizSelector';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';


const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/480px-Apple_logo_black.svg.png', logoWidth: 40, logoHeight: 48 },
  { id: 2, brand: 'Gucci', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gucci_logo.svg/1200px-Gucci_logo.svg.png', logoWidth: 90, logoHeight: 25 },
  { id: 3, brand: 'SBI', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/1024px-SBI-logo.svg.png', logoWidth: 60, logoHeight: 60 },
  { id: 4, brand: 'Nike', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png', logoWidth: 80, logoHeight: 30 },
  { id: 5, brand: 'Amazon', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png', logoWidth: 70, logoHeight: 25 },
  { id: 6, brand: 'PayPal', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png', logoWidth: 90, logoHeight: 25 },
];

// This new component encapsulates all the frequently-updating parts of the UI.
// It manages its own state for the selected brand, preventing the main HomeWrapper
// from re-rendering every time the cube rotates.
const QuizSelection = ({ onStartQuiz }: { onStartQuiz: (brand: CubeBrand) => void }) => {
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
    const selectedBrand = brands[selectedBrandIndex];

    const handleFaceSelect = useCallback((index: number) => {
        setSelectedBrandIndex(index);
    }, []);

    const handleStart = useCallback(() => {
        onStartQuiz(selectedBrand);
    }, [onStartQuiz, selectedBrand]);

    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face, banner or button to start!</p>
            </div>
            
            <QuizSelector 
                brands={brands}
                onFaceSelect={handleFaceSelect}
                onFaceClick={handleStart}
            />

            <div className="mt-8 space-y-8">
                <SelectedBrandCard
                  selectedBrand={selectedBrand}
                  handleStartQuiz={handleStart}
                />
                
                <GlobalStats />

                <StartQuizButton
                  brandFormat={selectedBrand.format}
                  onClick={handleStart}
                />
            </div>
        </>
    );
};


export default function HomeWrapper() {
  const { user } = useAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();

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
      // Geolocation
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
      
      // Notification permission
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
  }, []); // Empty dependency array means this runs once on mount

  if (isQuizStatusLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return <QuizSelection onStartQuiz={handleStartQuiz} />;
}
