
'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';
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

interface QuizSelectorProps {
    onStartQuiz: (brand: string, format: string) => void;
}

const QuizSelector = ({ onStartQuiz }: QuizSelectorProps) => {
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);

    const handleBrandSelect = useCallback((index: number) => {
        setSelectedBrandIndex(index);
    }, []);

    const selectedBrand = useMemo(() => brands[selectedBrandIndex], [selectedBrandIndex]);

    const onCubeFaceClick = useCallback((brand: CubeBrand) => {
        onStartQuiz(brand.brand, brand.format);
    }, [onStartQuiz]);

    const onStartQuizClick = useCallback(() => {
        onStartQuiz(selectedBrand.brand, selectedBrand.format);
    }, [onStartQuiz, selectedBrand]);

    return (
        <>
            <Cube 
                brands={brands} 
                onSelect={handleBrandSelect}
                onFaceClick={onCubeFaceClick}
            />
            <SelectedBrandCard 
                selectedBrand={selectedBrand}
                handleStartQuiz={onCubeFaceClick}
            />
            <StartQuizButton 
                brandFormat={selectedBrand.format}
                onClick={onStartQuizClick}
            />
        </>
    );
}

export default memo(QuizSelector);
