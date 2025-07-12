
'use client';

import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import type { CubeBrand } from '@/components/home/brandData';
import QuizSelector from '@/components/home/QuizSelector';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';
import { brands } from './brandData';


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
    }, []);

    const selectedBrand = brands[selectedBrandIndex];

    const handleStartQuizForBrand = useCallback(() => {
        onStartQuiz(selectedBrand);
    }, [onStartQuiz, selectedBrand]);
    
    useEffect(() => {
        const rotateToNextFace = () => {
          setSelectedBrandIndex(prevIndex => (prevIndex + 1) % brands.length);
        };
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(rotateToNextFace, 3000);
        
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
