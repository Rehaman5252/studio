
'use client';

import React, { Suspense } from 'react';
import type { CubeBrand } from '@/components/home/brandData';
import Scene from './Scene';
import { Loader } from 'lucide-react';

interface QuizSelectorProps {
    brands: CubeBrand[];
    visibleFaceIndex: number;
    onFaceClick: (index: number) => void;
    isRotating: boolean;
}

function QuizSelector({ brands, visibleFaceIndex, onFaceClick, isRotating }: QuizSelectorProps) {
    return (
        <div className="w-full h-52 flex items-center justify-center">
            <Suspense fallback={<Loader className="h-12 w-12 animate-spin text-primary" />}>
                <Scene 
                    brands={brands}
                    visibleFaceIndex={visibleFaceIndex}
                    onFaceClick={onFaceClick}
                    isRotating={isRotating}
                />
            </Suspense>
        </div>
    );
};

export default QuizSelector;
