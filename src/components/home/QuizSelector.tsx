
'use client';

import React from 'react';
import type { CubeBrand } from '@/components/home/brandData';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    visibleFaceIndex: number;
    onFaceClick: (index: number) => void;
}

function QuizSelector({ brands, visibleFaceIndex, onFaceClick }: QuizSelectorProps) {
    return (
        <div className="animate-fade-in-up">
            <Cube
                brands={brands}
                visibleFaceIndex={visibleFaceIndex}
                onFaceClick={onFaceClick}
            />
        </div>
    );
};

export default QuizSelector;
