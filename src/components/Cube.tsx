
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
  onFaceClick: (index: number) => void;
}

function Cube({ brands, onFaceSelect, onFaceClick }: CubeProps) {
  const [currentFaceIndex, setCurrentFaceIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // This effect handles the automatic rotation of the cube.
    const rotateToNextFace = () => {
      setCurrentFaceIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % brands.length;
        // The parent is notified of the change here, which is safe
        // because it happens in response to the state update within this component.
        onFaceSelect(nextIndex); 
        return nextIndex;
      });
    };
    
    // Clear any existing timer
    if (timerRef.current) {
        clearInterval(timerRef.current);
    }
    // Start a new timer
    timerRef.current = setInterval(rotateToNextFace, 500);
    
    // Cleanup on unmount
    return () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
    };
  }, [brands.length, onFaceSelect]);


  useEffect(() => {
    // This effect applies the CSS transform to the cube when the face changes.
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[currentFaceIndex];
    }
  }, [currentFaceIndex]);
  
  return (
    <div 
      className="flex justify-center items-center h-48"
    >
      <div 
        className="w-32 h-32 perspective"
      >
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ 
            transition: 'transform 0.333s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform' 
          }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={() => onFaceClick(index)}
              role="button"
              tabIndex={0}
              aria-label={`Select ${brand.format} quiz`}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onFaceClick(index)}
              className={cn(
                "absolute w-32 h-32 left-0 top-0 rounded-xl border backface-hidden bg-card/80 border-primary/20 shadow-xl shadow-black/40",
                "cursor-pointer hover:border-primary hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
              )}
              style={{
                transform: faceTransforms[index],
              }}
            >
              <div className="flex flex-col items-center justify-center h-full text-center p-2 gap-2">
                <Image
                  src={brand.logoUrl}
                  alt={`${brand.brand} logo`}
                  data-ai-hint="cricket logo"
                  width={brand.logoWidth}
                  height={brand.logoHeight}
                  className="object-contain px-2 drop-shadow-lg"
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
