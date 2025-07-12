
'use client';

import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import type { CubeBrand } from '@/components/Cube';
import QuizSelector from '@/components/home/QuizSelector';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';

const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', logoWidth: 50, logoHeight: 60 },
  { id: 2, brand: 'Nike', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_NIKE.svg', logoWidth: 80, logoHeight: 40 },
  { id: 3, brand: 'SBI', format: 'Test', logoUrl: 'https://cdn.icon-icons.com/icons2/2699/PNG/512/sbi_logo_icon_170252.png', logoWidth: 80, logoHeight: 60 },
  { id: 4, brand: 'Colgate', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Colgate-Palmolive_logo_black.svg/2560px-Colgate-Palmolive_logo_black.svg.png', logoWidth: 80, logoHeight: 50 },
  { id: 5, brand: 'Gucci', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/79/Gucci_logo.svg', logoWidth: 80, logoHeight: 50 },
  { id: 6, brand: 'Amazon', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', logoWidth: 80, logoHeight: 50 },
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
                onRotation={handleRotation}
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
