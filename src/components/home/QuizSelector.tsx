'use client';

import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import type { CubeBrand } from '@/components/home/brandData';
import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';
import { brands } from './brandData';
import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';

interface QuizSelectorProps {
  onStartQuiz: (brand: CubeBrand) => void;
}

const QuizFace = memo(({ brand, onFaceClick }: { brand: CubeBrand; onFaceClick: (brand: CubeBrand) => void }) => {
    return (
        <div
            onClick={() => onFaceClick(brand)}
            className="w-full h-full flex items-center justify-center p-2 cursor-pointer bg-card/50 rounded-lg border border-primary/20 transition-all hover:bg-primary/10 hover:border-primary"
        >
            <Image
                src={brand.logoUrl}
                alt={`${brand.brand} logo`}
                width={brand.logoWidth || 80}
                height={brand.logoHeight || 80}
                className="object-contain"
                style={{ filter: brand.invertOnDark ? 'invert(1)' : 'none' }}
                priority
            />
        </div>
    );
});
QuizFace.displayName = "QuizFace";


function QuizSelector({ onStartQuiz }: QuizSelectorProps) {
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleCubeClick = useCallback((brand: CubeBrand) => {
        const index = brands.findIndex(b => b.id === brand.id);
        setSelectedBrandIndex(index);
        
        // Stop the autorotate timer on user interaction
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const selectedBrand = brands[selectedBrandIndex];

    const handleStartQuizForBrand = useCallback(() => {
        onStartQuiz(selectedBrand);
    }, [onStartQuiz, selectedBrand]);
    
    // Auto-rotation effect
    useEffect(() => {
        const rotateToNextFace = () => {
          setSelectedBrandIndex(prevIndex => (prevIndex + 1) % brands.length);
        };
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(rotateToNextFace, 4000);
        
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
            
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4 aspect-[2/1] sm:aspect-[4/1]">
                {brands.map((brand) => (
                    <QuizFace
                        key={brand.id}
                        brand={brand}
                        onFaceClick={handleCubeClick}
                    />
                ))}
            </div>


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

export default memo(QuizSelector);
