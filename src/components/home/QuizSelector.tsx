
'use client';

import React, { memo, useEffect, useRef } from 'react';
import type { CubeBrand } from '@/components/Cube';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceClick: (index: number) => void;
    visibleFaceIndex: number;
    setVisibleFaceIndex: (index: number) => void;
}

const QuizSelector = ({ brands, onFaceClick, visibleFaceIndex, setVisibleFaceIndex }: QuizSelectorProps) => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const handleInteraction = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleClick = (index: number) => {
        handleInteraction();
        setVisibleFaceIndex(index);
        onFaceClick(index);
    };

    useEffect(() => {
        const rotateToNextFace = () => {
          setVisibleFaceIndex((prevIndex) => (prevIndex + 1) % brands.length);
        };
        
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(rotateToNextFace, 3000);
        
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [brands.length, setVisibleFaceIndex]);

    return (
        <div onMouseEnter={handleInteraction} onTouchStart={handleInteraction}>
            <Cube 
                brands={brands} 
                onFaceClick={handleClick}
                visibleFaceIndex={visibleFaceIndex}
            />
        </div>
    );
}

export default memo(QuizSelector);
