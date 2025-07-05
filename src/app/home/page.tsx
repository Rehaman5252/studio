
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Loader2,
} from 'lucide-react';
import type { CubeBrand } from '@/components/Cube';
import { Separator } from '@/components/ui/separator';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic imports for heavy components
const Cube = dynamic(() => import('@/components/Cube'), {
  loading: () => <Skeleton className="w-48 h-48 mx-auto" />,
  ssr: false, // Cube has animations and client-side logic
});

const SelectedBrandCard = dynamic(() => import('@/components/home/SelectedBrandCard'), {
  loading: () => <Skeleton className="w-full mt-8 h-[140px] rounded-2xl" />,
});

const GlobalStats = dynamic(() => import('@/components/home/GlobalStats'), {
  loading: () => (
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="w-full h-[108px] rounded-lg" />
      <Skeleton className="w-full h-[108px] rounded-lg" />
      <Skeleton className="w-full h-[108px] rounded-lg" />
      <Skeleton className="w-full h-[108px] rounded-lg" />
    </div>
  ),
});

const StartQuizButton = dynamic(() => import('@/components/home/StartQuizButton'), {
  loading: () => <Skeleton className="w-full mt-8 h-[60px] rounded-full" />,
});


const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/480px-Apple_logo_black.svg.png', logoWidth: 40, logoHeight: 48 },
  { id: 2, brand: 'Gucci', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gucci_logo.svg/1200px-Gucci_logo.svg.png', logoWidth: 90, logoHeight: 25 },
  { id: 3, brand: 'SBI', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/1024px-SBI-logo.svg.png', logoWidth: 60, logoHeight: 60 },
  { id: 4, brand: 'Nike', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png', logoWidth: 80, logoHeight: 30 },
  { id: 5, brand: 'Amazon', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png', logoWidth: 70, logoHeight: 25 },
  { id: 6, brand: 'PayPal', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/1200px-PayPal.svg.png', logoWidth: 90, logoHeight: 25 },
];


export default function HomeScreen() {
  const { loading: authLoading } = useRequireAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const router = useRouter();

  const loading = authLoading || isQuizStatusLoading;

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (loading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, loading]);

  const handleBrandSelect = useCallback((index: number) => {
    setSelectedBrandIndex(index);
  }, []);

  const handleStartQuiz = useCallback((brand: string, format: string) => {
    if (hasPlayedInCurrentSlot) {
      router.push(`/quiz/results`);
    } else {
      router.push(`/quiz?brand=${encodeURIComponent(brand)}&format=${encodeURIComponent(format)}`);
    }
  }, [router, hasPlayedInCurrentSlot]);
  
  const selectedBrand = brands[selectedBrandIndex];

  if (loading) {
      return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Indcric
          </h1>
          <p className="text-sm text-muted-foreground">Win ₹100 for every 100 seconds</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
            <p className="text-sm text-muted-foreground">Click a face on the cube to start!</p>
          </div>

          <Cube 
            brands={brands} 
            onSelect={handleBrandSelect}
            onFaceClick={(brand) => {
              handleStartQuiz(brand.brand, brand.format);
            }}
          />

          <SelectedBrandCard 
            selectedBrand={selectedBrand}
            handleStartQuiz={handleStartQuiz}
          />
          
          <Separator className="my-8 bg-border/50" />

          <GlobalStats />

          <StartQuizButton 
            brandFormat={selectedBrand.format}
            onClick={() => handleStartQuiz(selectedBrand.brand, selectedBrand.format)}
          />
        </div>
      </main>
    </div>
  );
}
