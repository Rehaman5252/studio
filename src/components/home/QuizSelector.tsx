
'use client';

import React, { memo } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceClick: (brand: CubeBrand) => void;
    disabled?: boolean;
}

const QuizSelector = ({ brands, onFaceClick, disabled }: QuizSelectorProps) => {
    return (
        <Cube 
            brands={brands} 
            onFaceClick={onFaceClick}
            disabled={disabled}
        />
    );
}

export default memo(QuizSelector);
