
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

// Positions each face of the cube in 3D space. The `translateZ` value is half the face width (128px / 2 = 64px).
const faceTransforms = [
  'rotateY(0deg) translateZ(64px)',
  'rotateY(90deg) translateZ(64px)',
  'rotateY(180deg) translateZ(64px)',
  'rotateY(-90deg) translateZ(64px)',
  'rotateX(90deg) translateZ(64px)',
  'rotateX(-90deg) translateZ(64px)',
];

// Defines the transform needed to bring a specific face to the front
const rotationMap = [
    'rotateX(0deg) rotateY(0deg)',
    'rotateX(0deg) rotateY(-90deg)',
    'rotateX(0deg) rotateY(-180deg)',
    'rotateX(0deg) rotateY(90deg)',
    'rotateX(-90deg) rotateY(0deg)',
    'rotateX(90deg) rotateY(0deg)',
];

// A dynamic sequence to show faces in a tumbling order
const faceRotationOrder = [0, 4, 1, 5, 3, 2]; // Front, Top, Right, Bottom, Left, Back

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

  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    isAutoRotating.current = true;
    const rotate = () => {
        setRotationOrderIndex(prevIndex => (prevIndex + 1) % faceRotationOrder.length);
        rotationTimeoutRef.current = setTimeout(rotate, 1500);
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

  useEffect(() => {
    const faceToShow = faceRotationOrder[rotationOrderIndex];
    rotateToFace(faceToShow);
    if (isAutoRotating.current) {
      onSelect(faceToShow);
    }
  }, [rotationOrderIndex, rotateToFace, onSelect]);

  const handleFaceClick = (brandIndex: number) => {
    if (disabled) return;
    
    stopAutoRotation();
    const brand = brands[brandIndex];
    onFaceClick(brand);
    onSelect(brandIndex);

    const newRotationOrderIndex = faceRotationOrder.indexOf(brandIndex);
    if (newRotationOrderIndex !== -1) {
        setRotationOrderIndex(newRotationOrderIndex);
    } else {
        rotateToFace(brandIndex);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className={cn("w-48 h-48 perspective", disabled && "opacity-50")}>
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ transition: 'transform 0.75s ease-in-out' }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={() => handleFaceClick(index)}
              className={cn(
                "absolute w-32 h-32 left-[calc(50%-64px)] top-[calc(50%-64px)] rounded-xl border backface-hidden bg-white/10 backdrop-blur-lg border-white/30 shadow-xl shadow-black/20",
                !disabled && "cursor-pointer transition-all hover:bg-white/20 hover:border-white"
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
                />
                <span className="text-xs font-semibold text-white opacity-90">
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
