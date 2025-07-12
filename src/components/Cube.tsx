
'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { CubeBrand } from '@/components/home/brandData';

interface CubeProps {
  brands: CubeBrand[];
  visibleFaceIndex: number;
  onFaceClick: (index: number) => void;
}

const faceTransforms = [
  'rotateY(0deg) translateZ(50px)',      // Front
  'rotateY(90deg) translateZ(50px)',     // Right
  'rotateY(180deg) translateZ(50px)',    // Back
  'rotateY(-90deg) translateZ(50px)',    // Left
  'rotateX(90deg) translateZ(50px)',     // Top
  'rotateX(-90deg) translateZ(50px)',    // Bottom
];

const cubeRotation = (index: number) => {
    switch (index) {
        case 0: return 'rotateY(0deg)';    // Front
        case 1: return 'rotateY(-90deg)';  // Right
        case 2: return 'rotateY(-180deg)'; // Back
        case 3: return 'rotateY(90deg)';   // Left
        case 4: return 'rotateX(-90deg)';  // Top
        case 5: return 'rotateX(90deg)';   // Bottom
        default: return 'rotateY(0deg)';
    }
}

export default function Cube({ brands, visibleFaceIndex, onFaceClick }: CubeProps) {
    const rotationStyle = {
        transform: cubeRotation(visibleFaceIndex),
    };

    return (
        <div className="w-full h-32 flex items-center justify-center perspective">
            <div
                className="relative w-24 h-24 preserve-3d transition-transform duration-1000"
                style={rotationStyle}
            >
                {brands.map((brand, index) => (
                    <div
                        key={brand.id}
                        className={cn(
                            "absolute w-24 h-24 flex items-center justify-center p-2 cursor-pointer",
                            "bg-card/50 border-2 border-primary/30",
                            "transition-all hover:border-primary hover:bg-primary/10"
                        )}
                        style={{ transform: faceTransforms[index] }}
                        onClick={() => onFaceClick(index)}
                    >
                        <Image
                            src={brand.whiteLogoUrl}
                            alt={`${brand.brand} white logo`}
                            width={brand.logoWidth || 60}
                            height={brand.logoHeight || 60}
                            className="object-contain"
                            priority
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
