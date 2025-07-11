
'use client';

import React, { useState, useCallback, memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import QuizSelector from '@/components/home/QuizSelector';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';

const brands: CubeBrand[] = [
  { id: 1, brand: 'IndCric', format: 'T20', logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-vector-png-pixabay-2.png', logoWidth: 60, logoHeight: 60 },
  { id: 2, brand: 'IndCric', format: 'WPL', logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-vector-png-pixabay-2.png', logoWidth: 60, logoHeight: 60 },
  { id: 3, brand: 'IndCric', format: 'Test', logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-vector-png-pixabay-2.png', logoWidth: 60, logoHeight: 60 },
  { id: 4, brand: 'IndCric', format: 'ODI', logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-vector-png-pixabay-2.png', logoWidth: 60, logoHeight: 60 },
  { id: 5, brand: 'IndCric', format: 'Mixed', logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-vector-png-pixabay-2.png', logoWidth: 60, logoHeight: 60 },
  { id: 6, brand: 'IndCric', format: 'IPL', logoUrl: 'https://www.freepnglogos.com/uploads/cricket-logo-png/cricket-logo-vector-png-pixabay-2.png', logoWidth: 60, logoHeight: 60 },
];

interface QuizSelectionProps {
  onStartQuiz: (brand: CubeBrand) => void;
}

function QuizSelection({ onStartQuiz }: QuizSelectionProps) {
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
    const selectedBrand = brands[selectedBrandIndex];
    
    const handleStartQuizForBrand = useCallback((brand: CubeBrand) => {
        onStartQuiz(brand);
    }, [onStartQuiz]);

    const handleFaceSelect = useCallback((index: number) => {
        setSelectedBrandIndex(index);
    }, []);

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
                onFaceSelect={handleFaceSelect}
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
