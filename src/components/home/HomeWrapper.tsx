'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { CubeBrand } from '@/components/Cube';
import CricketLoading from '@/components/CricketLoading';
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


export default function HomeWrapper() {
  const { user } = useAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();
  
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const [startingQuizInfo, setStartingQuizInfo] = useState<{ brand: string; format: string } | null>(null);

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, isQuizStatusLoading]);
  
  const handleFaceSelect = useCallback((index: number) => {
    setSelectedBrandIndex(index);
  }, []);

  const handleStartQuiz = useCallback(() => {
    if (!user && isFirebaseConfigured) {
      router.push('/auth/login?from=quiz');
      return;
    }
    
    const selectedBrand = brands[selectedBrandIndex];
    setStartingQuizInfo({ brand: selectedBrand.brand, format: selectedBrand.format });
  }, [selectedBrandIndex, user, router]);

  useEffect(() => {
    if (startingQuizInfo) {
      const timer = setTimeout(() => {
        if (hasPlayedInCurrentSlot) {
          router.push(`/quiz/results?review=true`);
        } else {
          router.push(`/quiz?brand=${encodeURIComponent(startingQuizInfo.brand)}&format=${encodeURIComponent(startingQuizInfo.format)}`);
        }
      }, 1500); // 1.5 second delay before navigation

      return () => clearTimeout(timer);
    }
  }, [startingQuizInfo, hasPlayedInCurrentSlot, router]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // You can now access the user's location.
          // For now, we'll just log it to the console.
          console.log('User location access granted:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
          // In a real app, you might save this to the user's profile in Firestore.
        },
        (error) => {
          // Handle errors, including the user denying permission.
          console.error('Geolocation error:', error.message);
        }
      );
    } else {
      console.log('Geolocation is not supported by this browser.');
    }
  }, []); // Empty dependency array means this runs once on mount

  if (isQuizStatusLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  if (startingQuizInfo) {
    return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
            <CricketLoading message={`You have selected ${startingQuizInfo.format} format. Getting your quiz ready...`} />
        </div>
    );
  }
  
  const selectedBrand = brands[selectedBrandIndex];

  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
        <p className="text-sm text-muted-foreground">Click a face, banner or button to start!</p>
      </div>
      
      <QuizSelector 
          brands={brands}
          onFaceSelect={handleFaceSelect}
          onFaceClick={handleStartQuiz}
          disabled={!!startingQuizInfo}
      />

      <div className="mt-8 space-y-8">
        <SelectedBrandCard
          selectedBrand={selectedBrand}
          handleStartQuiz={handleStartQuiz}
        />
        
        <GlobalStats />

        <StartQuizButton
          brandFormat={selectedBrand.format}
          onClick={handleStartQuiz}
        />
      </div>
    </>
  );
}