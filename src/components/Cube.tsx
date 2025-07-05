
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
  const isAutoRotating = useRef(false);

  const rotateToFace = useCallback((brandIndex: number) => {
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[brandIndex];
    }
  }, []);

  const stopAutoRotation = useCallback(() => {
    isAutoRotating.current = false;
    if (rotationTimeoutRef.current) {
      clearTimeout(rotationTimeoutRef.current);
      rotationTimeoutRef.current = null;
    }
  }, []);
  
  // This effect ensures the visual rotation happens whenever the index changes.
  useEffect(() => {
    const currentFaceIndex = faceRotationOrder[rotationOrderIndex];
    rotateToFace(currentFaceIndex);
  }, [rotationOrderIndex, rotateToFace]);

  // This effect calls onSelect only on the initial load to set the first card.
  useEffect(() => {
    onSelect(faceRotationOrder[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    isAutoRotating.current = true;
    const rotate = () => {
        const newRotationIndex = (rotationOrderIndex + 1) % faceRotationOrder.length;
        const newBrandIndexOnDeck = faceRotationOrder[newRotationIndex];
        
        // This is the key change: update the parent component's state
        // with the *next* brand that will be displayed *before* the animation starts.
        onSelect(newBrandIndexOnDeck);

        // Update local state to trigger the visual rotation animation.
        setRotationOrderIndex(newRotationIndex);
        
        rotationTimeoutRef.current = setTimeout(rotate, 2000);
    };
    rotationTimeoutRef.current = setTimeout(rotate, 2000); // Start the first rotation after a delay
  }, [rotationOrderIndex, onSelect, stopAutoRotation]);

  // This effect controls the starting and stopping of the auto-rotation.
  useEffect(() => {
    if(disabled) {
        stopAutoRotation();
    } else {
        startAutoRotation();
    }
    return stopAutoRotation;
  }, [disabled, startAutoRotation, stopAutoRotation]);

  const handleFaceClick = (brandIndex: number) => {
    if (disabled) return;
    
    stopAutoRotation();
    onSelect(brandIndex); // Ensure parent knows the clicked brand
    
    const brand = brands[brandIndex];
    onFaceClick(brand); // Notify parent to start the quiz

    const newRotationOrderIndex = faceRotationOrder.indexOf(brandIndex);
    if (newRotationOrderIndex !== -1) {
        setRotationOrderIndex(newRotationOrderIndex);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn("w-48 h-48 perspective", disabled && "opacity-50")}>
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ transition: 'transform 1s cubic-bezier(0.4, 0, 0.2, 1)' }}
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
