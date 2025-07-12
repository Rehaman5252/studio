
'use client';

import type { CubeBrand } from '@/components/home/brandData';
import Scene from '@/components/home/Scene';

interface QuizSelectorProps {
    brands: CubeBrand[];
    onFaceClick: (index: number) => void;
    visibleFaceIndex: number;
    isRotating: boolean;
}

export default function QuizSelector({ brands, onFaceClick, visibleFaceIndex, isRotating }: QuizSelectorProps) {    
    return (
        <Scene 
            brands={brands}
            onFaceClick={onFaceClick}
            visibleFaceIndex={visibleFaceIndex}
            isRotating={isRotating}
        />
    );
};
