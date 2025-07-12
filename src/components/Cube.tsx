
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
  'rotateY(0deg) translateZ(125px)',      // Front
  'rotateY(90deg) translateZ(125px)',     // Right
  'rotateY(180deg) translateZ(125px)',    // Back
  'rotateY(-90deg) translateZ(125px)',    // Left
  'rotateX(90deg) translateZ(125px)',     // Top
  'rotateX(-90deg) translateZ(125px)',    // Bottom
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
        <div className="w-full h-64 flex items-center justify-center perspective">
            <div
                className="relative w-56 h-56 preserve-3d transition-transform duration-1000"
                style={rotationStyle}
            >
                {brands.map((brand, index) => (
                    <div
                        key={brand.id}
                        className={cn(
                            "absolute w-56 h-56 flex items-center justify-center p-4 cursor-pointer",
                            "bg-card/50 border-2 border-primary/30",
                            "transition-all hover:border-primary hover:bg-primary/10"
                        )}
                        style={{ transform: faceTransforms[index] }}
                        onClick={() => onFaceClick(index)}
                    >
                        <Image
                            src={brand.logoUrl}
                            alt={`${brand.brand} logo`}
                            width={brand.logoWidth || 100}
                            height={brand.logoHeight || 100}
                            className="object-contain"
                            style={{ filter: brand.invertOnDark ? 'invert(1)' : 'none' }}
                            priority
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
