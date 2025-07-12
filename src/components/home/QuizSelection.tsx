
'use client';

import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import type { CubeBrand } from '@/components/Cube';
import QuizSelector from '@/components/home/QuizSelector';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';

const brands: CubeBrand[] = [
  { id: 1, brand: 'SBI', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/State_Bank_of_India_logo.svg/1024px-State_Bank_of_India_logo.svg.png', logoWidth: 60, logoHeight: 60 },
  { id: 2, brand: 'Gucci', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Gucci_logo.svg', logoWidth: 100, logoHeight: 60 },
  { id: 3, brand: 'Amazon', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', logoWidth: 80, logoHeight: 50 },
  { id: 4, brand: 'PayPal', format: 'ODI', logoUrl: 'https://assets.stickpng.com/images/580b57fcd9996e24bc43c530.png', logoWidth: 80, logoHeight: 50 },
  { id: 5, brand: 'Nike', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', logoWidth: 80, logoHeight: 40 },
  { id: 6, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', logoWidth: 50, logoHeight: 60 },
];


interface QuizSelectionProps {
  onStartQuiz: (brand: CubeBrand) => void;
}

function QuizSelection({ onStartQuiz }: QuizSelectionProps) {
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleRotation = useCallback((index: number) => {
        setSelectedBrandIndex(index);
    }, []);
    
    const handleCubeClick = useCallback((index: number) => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setSelectedBrandIndex(index);
        onStartQuiz(brands[index]);
    }, [onStartQuiz]);

    const selectedBrand = brands[selectedBrandIndex];

    const handleStartQuizForBrand = useCallback(() => {
        onStartQuiz(selectedBrand);
    }, [onStartQuiz, selectedBrand]);
    
    useEffect(() => {
        const rotateToNextFace = () => {
          setSelectedBrandIndex(prevIndex => (prevIndex + 1) % brands.length);
        };
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(rotateToNextFace, 500);
        
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return (
        <div className="animate-fade-in-up">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face to play!</p>
            </div>
            
            <QuizSelector 
                brands={brands}
                onFaceClick={handleCubeClick}
                visibleFaceIndex={selectedBrandIndex}
            />

            <div className="mt-8 space-y-8">
                <SelectedBrandCard
                  selectedBrand={selectedBrand}
                  handleStartQuiz={handleStartQuizForBrand}
                />
                
                <GlobalStats />

                <StartQuizButton
                  brandFormat={selectedBrand.format}
                  onClick={handleStartQuizForBrand}
                />
            </div>
        </div>
    );
};

export default memo(QuizSelection);
