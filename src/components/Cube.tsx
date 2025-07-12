
'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { CubeBrand } from '@/components/home/brandData';

interface CubeProps {
  brands: CubeBrand[];
  visibleFaceIndex: number;
  onFaceClick: (index: number) => void;
}

const faceTransforms = [
  'rotateY(0deg) translateZ(72px)',      // Front
  'rotateY(90deg) translateZ(72px)',     // Right
  'rotateY(180deg) translateZ(72px)',    // Back
  'rotateY(-90deg) translateZ(72px)',    // Left
  'rotateX(90deg) translateZ(72px)',     // Top
  'rotateX(-90deg) translateZ(72px)',    // Bottom
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
        <div className="w-full h-48 flex items-center justify-center perspective">
            <div
                className="relative w-36 h-36 preserve-3d transition-transform duration-1000"
                style={rotationStyle}
            >
                {brands.map((brand, index) => (
                    <div
                        key={brand.id}
                        className={cn(
                            "absolute w-36 h-36 flex items-center justify-center cursor-pointer",
                            "bg-card/50 border-2 border-primary/30",
                            "transition-all hover:border-primary hover:bg-primary/10",
                            "bg-no-repeat bg-center"
                        )}
                        style={{
                          transform: faceTransforms[index],
                          backgroundImage: `url(${brand.whiteLogoUrl})`,
                          backgroundSize: '80%',
                        }}
                        onClick={() => onFaceClick(index)}
                        aria-label={`Select ${brand.brand} quiz`}
                    />
                ))}
            </div>
        </div>
    );
}
