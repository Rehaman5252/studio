
'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import GlobalStats from '@/components/home/GlobalStats';
import QuizSelector from '@/components/home/QuizSelector';
import type { CubeBrand } from '@/components/Cube';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
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
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const router = useRouter();
  
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (isQuizStatusLoading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, isQuizStatusLoading]);

  const handleStartQuiz = useCallback((brand: string, format: string) => {
    if (hasPlayedInCurrentSlot) {
      router.push(`/quiz/results?review=true`);
    } else {
      router.push(`/quiz?brand=${encodeURIComponent(brand)}&format=${encodeURIComponent(format)}`);
    }
  }, [router, hasPlayedInCurrentSlot]);
  
  const selectedBrand = useMemo(() => brands[selectedBrandIndex], [selectedBrandIndex]);

  const onCubeFaceClick = useCallback((brand: CubeBrand) => {
    handleStartQuiz(brand.brand, brand.format);
  }, [handleStartQuiz]);

  const onStartQuizClick = useCallback(() => {
    handleStartQuiz(selectedBrand.brand, selectedBrand.format);
  }, [handleStartQuiz, selectedBrand]);


  if (isQuizStatusLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <>
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
        <p className="text-sm text-muted-foreground">Click a face on the cube to start!</p>
      </div>
      
      <QuizSelector 
          brands={brands} 
          onSelect={setSelectedBrandIndex}
          onFaceClick={onCubeFaceClick}
      />
      <SelectedBrandCard 
          selectedBrand={selectedBrand}
          handleStartQuiz={() => onCubeFaceClick(selectedBrand)}
      />

      <Separator className="my-8 bg-border/50" />

      <GlobalStats />

      <StartQuizButton 
          brandFormat={selectedBrand.format}
          onClick={onStartQuizClick}
      />
    </>
  );
}
