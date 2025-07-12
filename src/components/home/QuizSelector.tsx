
'use client';

import React, { memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onRotation: (index: number) => void;
    onFaceClick: (index: number) => void;
}

const QuizSelector = ({ brands, onRotation, onFaceClick }: QuizSelectorProps) => {
    return (
        <div>
            <Cube 
                brands={brands} 
                onRotation={onRotation}
                onFaceClick={onFaceClick}
            />
        </div>
    );
}

export default memo(QuizSelector);
