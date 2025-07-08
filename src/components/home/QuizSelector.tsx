
'use client';

import React, { memo, useState } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';
import { cn } from '@/lib/utils';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceSelect: (index: number) => void;
    onFaceClick: () => void;
    disabled?: boolean;
}

const QuizSelector = ({ brands, onFaceSelect, onFaceClick, disabled }: QuizSelectorProps) => {
    const [isHovering, setIsHovering] = useState(false);
    
    const effectiveDisabled = disabled || isHovering;

    return (
        <div 
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={cn(disabled && "cursor-not-allowed")}
        >
            <Cube 
                brands={brands} 
                onFaceSelect={onFaceSelect}
                onFaceClick={onFaceClick}
                disabled={effectiveDisabled}
            />
        </div>
    );
}

export default memo(QuizSelector);
