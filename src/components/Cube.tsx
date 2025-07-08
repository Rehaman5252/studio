
'use client';

import React, { useState, useEffect, useRef, memo, useCallback } from 'react';
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

interface CubeProps {
  brands: CubeBrand[];
  onFaceSelect: (index: number) => void;
  onFaceClick: () => void;
}

function Cube({ brands, onFaceSelect, onFaceClick }: CubeProps) {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRotating = useRef(true);

  const startRotation = useCallback(() => {
    if (!isRotating.current) return;
    timerRef.current = setInterval(() => {
      setCurrentFaceIndex(prevIndex => (prevIndex + 1) % brands.length);
    }, 3000); // Slower, more deliberate rotation
  }, [brands.length]);

  useEffect(() => {
    startRotation();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startRotation]);

  useEffect(() => {
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[currentFaceIndex];
    }
    onFaceSelect(currentFaceIndex);
  }, [currentFaceIndex, onFaceSelect]);

  const handleCubeClick = useCallback(() => {
    if (isRotating.current && timerRef.current) {
      clearInterval(timerRef.current);
      isRotating.current = false;
    }
    onFaceClick();
  }, [onFaceClick]);

  return (
    <div 
      className="group flex justify-center items-center h-48 cursor-pointer"
      onClick={handleCubeClick}
      role="button"
      tabIndex={0}
      aria-label="Select quiz format cube"
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleCubeClick()}
    >
      <div 
        className="w-32 h-32 perspective"
      >
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ 
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform' 
          }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              className={cn(
                "absolute w-32 h-32 left-0 top-0 rounded-xl border backface-hidden bg-card/80 border-primary/20 shadow-xl shadow-black/40 transition-all duration-300",
                "group-hover:border-primary group-hover:shadow-2xl group-hover:shadow-primary/40"
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
                  priority
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
