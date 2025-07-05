
'use client';

import React, { memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onSelect: (index: number) => void;
    onFaceClick: (brand: CubeBrand) => void;
}

const QuizSelector = ({ brands, onSelect, onFaceClick }: QuizSelectorProps) => {
    return (
        <Cube 
            brands={brands} 
            onSelect={onSelect}
            onFaceClick={onFaceClick}
        />
    );
}

export default memo(QuizSelector);
