
'use client';

import React, { memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceSelect: (index: number) => void;
    onFaceClick: () => void;
    disabled?: boolean;
}

const QuizSelector = ({ brands, onFaceSelect, onFaceClick, disabled }: QuizSelectorProps) => {
    return (
        <Cube 
            brands={brands} 
            onFaceSelect={onFaceSelect}
            onFaceClick={onFaceClick}
            disabled={disabled}
        />
    );
}

export default memo(QuizSelector);
