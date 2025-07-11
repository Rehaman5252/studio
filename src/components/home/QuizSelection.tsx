
'use client';

import React, { useState, useCallback, memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import QuizSelector from '@/components/home/QuizSelector';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';

const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', logoWidth: 50, logoHeight: 60 },
  { id: 2, brand: 'Nike', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', logoWidth: 80, logoHeight: 40 },
  { id: 3, brand: 'SBI', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg', logoWidth: 80, logoHeight: 60 },
  { id: 4, brand: 'PayPal', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg', logoWidth: 80, logoHeight: 50 },
  { id: 5, brand: 'Gucci', format: 'Mixed', logoUrl: 'https://www.freepnglogos.com/uploads/gucci-logo-png/gucci-logo-maison-de-luxe-italienne-1.png', logoWidth: 80, logoHeight: 50 },
  { id: 6, brand: 'Amazon', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', logoWidth: 80, logoHeight: 50 },
];

interface QuizSelectionProps {
  onStartQuiz: (brand: CubeBrand) => void;
  selectedBrandIndex: number;
  setSelectedBrandIndex: (index: number) => void;
}

function QuizSelection({ onStartQuiz, selectedBrandIndex, setSelectedBrandIndex }: QuizSelectionProps) {
    const selectedBrand = brands[selectedBrandIndex];
    
    const handleStartQuizForBrand = useCallback((brand: CubeBrand) => {
        onStartQuiz(brand);
    }, [onStartQuiz]);

    const handleCubeClick = useCallback((index: number) => {
        const brand = brands[index];
        onStartQuiz(brand);
    }, [onStartQuiz]);

    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to play!</p>
            </div>
            
            <QuizSelector 
                brands={brands}
                onFaceSelect={setSelectedBrandIndex}
                onFaceClick={handleCubeClick}
            />

            <div className="mt-8 space-y-8">
                <SelectedBrandCard
                  selectedBrand={selectedBrand}
                  handleStartQuiz={() => handleStartQuizForBrand(selectedBrand)}
                />
                
                <GlobalStats />

                <StartQuizButton
                  brandFormat={selectedBrand.format}
                  onClick={() => handleStartQuizForBrand(selectedBrand)}
                />
            </div>
        </>
    );
};

export default memo(QuizSelection);
