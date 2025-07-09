
'use client';

import React, { memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceSelect: (index: number) => void;
    onFaceClick: (index: number) => void;
}

const QuizSelector = ({ brands, onFaceSelect, onFaceClick }: QuizSelectorProps) => {
    return (
        <div>
            <Cube 
                brands={brands} 
                onFaceSelect={onFaceSelect}
                onFaceClick={onFaceClick}
            />
        </div>
    );
}

export default memo(QuizSelector);
