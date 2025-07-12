
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
    const [isRotating, setIsRotating] = useState(true);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const resetRotationTimer = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        timerRef.current = setInterval(() => {
            setIsRotating(true);
        }, 5000); // Resume auto-rotation after 5 seconds of inactivity
    }, []);

    const handleRotation = useCallback((index: number) => {
        setSelectedBrandIndex(index);
        setIsRotating(false);
        resetRotationTimer();
    }, [resetRotationTimer]);
    
    const handleCubeClick = useCallback((index: number) => {
        setSelectedBrandIndex(index);
        setIsRotating(false);
        resetRotationTimer();
    }, [resetRotationTimer]);

    useEffect(() => {
        if (isRotating) {
            const rotateInterval = setInterval(() => {
                setSelectedBrandIndex(prevIndex => (prevIndex + 1) % brands.length);
            }, 3000); // Auto-rotate every 3 seconds
            return () => clearInterval(rotateInterval);
        }
    }, [isRotating]);

    useEffect(() => {
        resetRotationTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [resetRotationTimer]);

    const selectedBrand = brands[selectedBrandIndex];

    const handleStartQuizForBrand = useCallback(() => {
        onStartQuiz(selectedBrand);
    }, [onStartQuiz, selectedBrand]);
    
    return (
        <div className="animate-fade-in-up">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a face or use arrows to navigate!</p>
            </div>
            
            <QuizSelector 
                brands={brands}
                onFaceClick={handleCubeClick}
                visibleFaceIndex={selectedBrandIndex}
                isRotating={isRotating}
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
