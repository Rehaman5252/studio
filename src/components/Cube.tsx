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

  // This is the core logic fix. This effect runs ONLY ONCE and sets up a stable interval.
  useEffect(() => {
    // Set an initial random face.
    const initialFace = Math.floor(Math.random() * brands.length);
    setCurrentFaceIndex(initialFace);

    const rotateToNextFace = () => {
      // Use the functional form of setState to get the latest index without needing it as a dependency.
      setCurrentFaceIndex(prevIndex => (prevIndex + 1) % brands.length);
    };
    
    // The cube will now change faces every 1.5 seconds.
    const intervalId = setInterval(rotateToNextFace, 1500);
    
    // Cleanup function to clear the interval when the component unmounts.
    return () => clearInterval(intervalId);
  }, [brands.length]); // This dependency is stable and will only re-run if the number of brands changes.


  // This effect is now ONLY for side effects when the face changes.
  useEffect(() => {
    // 1. Apply the actual CSS transform to rotate the cube.
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[currentFaceIndex];
    }
    // 2. Inform the parent component which face is now showing.
    onFaceSelect(currentFaceIndex);
  }, [currentFaceIndex, onFaceSelect]);


  const handleFaceClick = () => {
    if (disabled) return;
    onFaceClick();
  };
  
  return (
    <div 
      className="flex justify-center items-center h-48"
    >
      <div 
        className={cn("w-32 h-32 perspective", disabled && "opacity-50")}
      >
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ 
            // The animation speed for each turn is 500ms (0.5s).
            transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            willChange: 'transform' 
          }}
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
                "absolute w-32 h-32 left-0 top-0 rounded-xl border backface-hidden bg-card/80 border-primary/20 shadow-xl shadow-black/40",
                !disabled && "cursor-pointer hover:border-primary hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
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
