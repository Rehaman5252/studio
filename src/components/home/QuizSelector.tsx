
'use client';

import React, { memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceClick: (index: number) => void;
    visibleFaceIndex: number;
}

const QuizSelector = ({ brands, onFaceClick, visibleFaceIndex }: QuizSelectorProps) => {
    return (
        <div>
            <Cube 
                brands={brands} 
                onFaceClick={onFaceClick}
                visibleFaceIndex={visibleFaceIndex}
            />
        </div>
    );
}

export default memo(QuizSelector);
