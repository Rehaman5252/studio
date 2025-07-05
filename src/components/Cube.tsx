
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
  
  useEffect(() => {
    // This effect runs whenever the auto-rotation index or a click changes the selected face.
    // It is responsible for calling the parent's onSelect callback and applying the visual rotation.
    // This safely decouples the parent state update from this component's render cycle.
    const currentFaceIndex = faceRotationOrder[rotationOrderIndex];
    onSelect(currentFaceIndex);
    rotateToFace(currentFaceIndex);
  }, [rotationOrderIndex, onSelect, rotateToFace]);

  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    isAutoRotating.current = true;
    const rotate = () => {
        // This function now *only* updates the local state of the Cube component.
        // It no longer calls onSelect directly, which was causing the error.
        setRotationOrderIndex(prevIndex => (prevIndex + 1) % faceRotationOrder.length);
        rotationTimeoutRef.current = setTimeout(rotate, 2000);
    };
    rotationTimeoutRef.current = setTimeout(rotate, 100);
  }, [stopAutoRotation]);

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
    const brand = brands[brandIndex];
    onFaceClick(brand); // Notify parent to start the quiz

    // Find the position in our auto-rotation sequence for the clicked face
    const newRotationOrderIndex = faceRotationOrder.indexOf(brandIndex);
    if (newRotationOrderIndex !== -1) {
        // Set the state. The useEffect hook will handle calling onSelect and rotating the cube.
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
