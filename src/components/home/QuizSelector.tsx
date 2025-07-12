
'use client';

import React, { memo, Suspense } from 'react';
import type { CubeBrand } from '@/components/home/brandData';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import { brands } from '@/components/home/brandData';
import Cube from '@/components/Cube';

interface QuizSelectorProps {
    onFaceClick: (brand: CubeBrand) => void;
}

const QuizSelector = ({ onFaceClick }: QuizSelectorProps) => {

    return (
        <div className="h-64 md:h-80 w-full cursor-pointer">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={1.5} />
                <pointLight position={[10, 10, 10]} intensity={1} />
                <Suspense fallback={null}>
                    <Cube brands={brands} onFaceClick={onFaceClick} />
                </Suspense>
                <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={2.5} />
            </Canvas>
        </div>
    );
}

export default memo(QuizSelector);
