'use client';

import React, { useState, useEffect, useRef, memo } from 'react';
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
  disabled?: boolean;
}

function Cube({ brands, onFaceSelect, onFaceClick, disabled = false }: CubeProps) {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);

  // Continuous, unpredictable rotation
  useEffect(() => {
    if (disabled) return;

    const rotationInterval = setInterval(() => {
      setCurrentFaceIndex(prevIndex => {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * 6); // 6 faces
        } while (nextIndex === prevIndex);
        return nextIndex;
      });
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(rotationInterval);
  }, [disabled]);

  // Update transform and notify parent when face changes
  useEffect(() => {
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[currentFaceIndex];
    }
    onFaceSelect(currentFaceIndex);
  }, [currentFaceIndex, onFaceSelect]);


  const handleFaceClick = () => {
    if (disabled) return;
    onFaceClick();
  };
  
  return (
    <div 
      id="tour-step-cube"
      className="flex flex-col items-center"
    >
      <div className={cn("w-48 h-48 perspective", disabled && "opacity-50")}>
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={handleFaceClick}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-label={`Select ${brand.format} quiz sponsored by ${brand.brand}`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleFaceClick()}
              className={cn(
                "absolute w-32 h-32 left-[calc(50%-64px)] top-[calc(50%-64px)] rounded-xl border backface-hidden bg-card/80 border-primary/20 shadow-xl shadow-black/40",
                !disabled && "cursor-pointer transition-all hover:border-primary hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
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
