
'use client';

import type { CubeBrand } from '@/components/home/brandData';
import { Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';

const Scene = dynamic(() => import('@/components/home/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-52 flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  )
});


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
