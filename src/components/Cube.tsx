'use client';

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
}

const faceTransforms = [
  'rotateY(0deg) translateZ(64px)',
  'rotateY(90deg) translateZ(64px)',
  'rotateY(180deg) translateZ(64px)',
  'rotateY(-90deg) translateZ(64px)',
  'rotateX(90deg) translateZ(64px)',
  'rotateX(-90deg) translateZ(64px)',
];

const rotationMap = [
    'rotateX(0deg) rotateY(0deg)',
    'rotateX(0deg) rotateY(-90deg)',
    'rotateX(0deg) rotateY(-180deg)',
    'rotateX(0deg) rotateY(90deg)',
    'rotateX(-90deg) rotateY(0deg)',
    'rotateX(90deg) rotateY(0deg)',
];

const faceRotationOrder = [0, 4, 1, 5, 3, 2];

interface CubeProps {
  brands: CubeBrand[];
  onSelect: (index: number) => void;
  onFaceClick: (brand: CubeBrand) => void;
  disabled?: boolean;
}

function Cube({ brands, onSelect, onFaceClick, disabled = false }: CubeProps) {
  const [rotationOrderIndex, setRotationOrderIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const stopAutoRotation = useCallback(() => {
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
      rotationTimeoutRef.current = null;
    }
  }, []);

  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    if (disabled) return;

    rotationTimeoutRef.current = setTimeout(() => {
        setRotationOrderIndex(prevIndex => (prevIndex + 1) % faceRotationOrder.length);
    }, 266); // Increased speed by 3x (from 800ms)
  }, [disabled, stopAutoRotation]);

  useEffect(() => {
    const brandIndex = faceRotationOrder[rotationOrderIndex];
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[brandIndex];
    }
    onSelect(brandIndex);
  }, [rotationOrderIndex, onSelect]);
  
  useEffect(() => {
    startAutoRotation();
    return stopAutoRotation;
  }, [rotationOrderIndex, startAutoRotation, stopAutoRotation]);

  const handleFaceClick = (brandIndex: number) => {
    if (disabled) return;
    onFaceClick(brands[brandIndex]);
  };
  
  return (
    <div 
      className="flex flex-col items-center"
    >
      <div className={cn("w-48 h-48 perspective", disabled && "opacity-50")}>
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ transition: 'transform 0.7s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={() => handleFaceClick(index)}
              className={cn(
                "absolute w-32 h-32 left-[calc(50%-64px)] top-[calc(50%-64px)] rounded-xl border backface-hidden bg-card/80 border-primary/20 shadow-xl shadow-black/40",
                !disabled && "cursor-pointer transition-all hover:border-primary hover:shadow-primary/20"
              )}
              style={{
                transform: faceTransforms[index],
              }}
            >
              <div className="flex flex-col items-center justify-center h-full text-center p-2 gap-2">
                <Image
                  src={brand.logoUrl}
                  alt={`${brand.brand} logo`}
                  width={brand.logoWidth}
                  height={brand.logoHeight}
                  className="object-contain px-2 drop-shadow-lg"
                  style={{filter: 'brightness(0) invert(1)'}}
                />
                <span className="text-xs font-semibold text-foreground opacity-90">
                  {brand.format}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default memo(Cube);
