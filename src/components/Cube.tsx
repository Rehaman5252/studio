'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';

export interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  color: string;
  bgColor: string;
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
}

export default function Cube({ brands, onSelect }: CubeProps) {
  const [rotationOrderIndex, setRotationOrderIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const rotationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const selectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const rotateToFace = useCallback((brandIndex: number) => {
    if (cubeRef.current) {
        cubeRef.current.style.transform = rotationMap[brandIndex];
    }
    
    if (selectTimeoutRef.current) {
      clearTimeout(selectTimeoutRef.current);
    }

    // Wait for the animation to finish before updating the selected brand/banner.
    selectTimeoutRef.current = setTimeout(() => {
        onSelect(brandIndex);
    }, 1500); // Sync with 1.5s CSS transition
  }, [onSelect]);

  const stopAutoRotation = useCallback(() => {
    if (rotationIntervalRef.current) {
      clearInterval(rotationIntervalRef.current);
      rotationIntervalRef.current = null;
    }
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }
  }, []);

  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    // Rotate every 3 seconds: 1.5s for transition, 1.5s for pause
    rotationIntervalRef.current = setInterval(() => {
      setRotationOrderIndex(prevIndex => (prevIndex + 1) % faceRotationOrder.length);
    }, 3000); 
  }, [stopAutoRotation]);

  useEffect(() => {
    const faceToShow = faceRotationOrder[rotationOrderIndex];
    rotateToFace(faceToShow);
  }, [rotationOrderIndex, rotateToFace]);

  useEffect(() => {
    startAutoRotation();
    return () => {
      stopAutoRotation();
      if (selectTimeoutRef.current) {
        clearTimeout(selectTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startAutoRotation]);

  const handleFaceClick = (brandIndex: number) => {
    stopAutoRotation();
    const newRotationOrderIndex = faceRotationOrder.indexOf(brandIndex);
    if (newRotationOrderIndex !== -1) {
        setRotationOrderIndex(newRotationOrderIndex);
    } else {
        rotateToFace(brandIndex);
    }
    // Restart auto-rotation after user interaction
    interactionTimeoutRef.current = setTimeout(startAutoRotation, 5000);
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48 perspective">
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ transition: 'transform 1.5s ease-in-out' }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={() => handleFaceClick(index)}
              className="absolute w-32 h-32 left-[calc(50%-64px)] top-[calc(50%-64px)] rounded-lg border-2 backface-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl"
              style={{
                transform: faceTransforms[index],
                backgroundColor: brand.bgColor, // Use full opacity
                borderColor: 'transparent',
              }}
            >
              <div className="flex flex-col items-center justify-center h-full text-center p-2 gap-2">
                <Image
                  src={brand.logoUrl}
                  alt={`${brand.brand} logo`}
                  width={brand.logoWidth}
                  height={brand.logoHeight}
                  className="object-contain px-2"
                />
                <span className="text-xs font-semibold" style={{ color: brand.color, opacity: 0.9 }}>
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
