
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

export default function Cube({ brands, onSelect, onFaceClick, disabled = false }: CubeProps) {
  const [rotationOrderIndex, setRotationOrderIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInteracting = useRef(false);

  const rotateToFace = useCallback((brandIndex: number) => {
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[brandIndex];
    }
  }, []);

  const stopAutoRotation = useCallback(() => {
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
      rotationTimeoutRef.current = null;
    }
  }, []);
  
  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    if (isInteracting.current || disabled) return;

    const rotate = () => {
      setRotationOrderIndex(prevIndex => {
          const newIndex = (prevIndex + 1) % faceRotationOrder.length;
          const newBrandIndexOnDeck = faceRotationOrder[newIndex];
          rotateToFace(newBrandIndexOnDeck);
          // This is the performance fix: Do NOT call the parent's onSelect prop here.
          // This prevents re-rendering the entire home page every 2 seconds.
          return newIndex;
      });
      rotationTimeoutRef.current = setTimeout(rotate, 2500);
    };
    rotationTimeoutRef.current = setTimeout(rotate, 2500);
  }, [disabled, rotateToFace, stopAutoRotation]);

  useEffect(() => {
    rotateToFace(faceRotationOrder[rotationOrderIndex]);
  }, [rotationOrderIndex, rotateToFace]);
  
  useEffect(() => {
    if (!disabled && !isInteracting.current) {
        startAutoRotation();
    } else {
        stopAutoRotation();
    }
    return stopAutoRotation;
  }, [disabled, startAutoRotation, stopAutoRotation]);
  
  useEffect(() => {
    onSelect(faceRotationOrder[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseEnterContainer = () => {
    isInteracting.current = true;
    stopAutoRotation();
  };
  
  const handleMouseLeaveContainer = () => {
    isInteracting.current = false;
    startAutoRotation();
  };

  const handleMouseEnterFace = (brandIndex: number) => {
    if (disabled) return;
    rotateToFace(brandIndex); // Snap to the hovered face
    onSelect(brandIndex); // Update the parent card ONLY on user interaction
  };

  const handleFaceClick = (brandIndex: number) => {
    if (disabled) return;
    onFaceClick(brands[brandIndex]);
  };
  
  return (
    <div 
      className="flex flex-col items-center"
      onMouseEnter={handleMouseEnterContainer}
      onMouseLeave={handleMouseLeaveContainer}
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
              onMouseEnter={() => handleMouseEnterFace(index)}
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
