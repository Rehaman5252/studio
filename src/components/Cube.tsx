
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

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
}

export default function Cube({ brands, onSelect }: CubeProps) {
  const [rotationOrderIndex, setRotationOrderIndex] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const rotationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const interactionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
      interactionTimeoutRef.current = null;
    }
  }, []);

  const startAutoRotation = useCallback(() => {
    stopAutoRotation();
    const rotate = () => {
        setRotationOrderIndex(prevIndex => {
            const nextIndex = (prevIndex + 1) % faceRotationOrder.length;
            onSelect(faceRotationOrder[nextIndex]);
            return nextIndex;
        });
        rotationTimeoutRef.current = setTimeout(rotate, 1500);
    };
    rotationTimeoutRef.current = setTimeout(rotate, 100);
  }, [stopAutoRotation, onSelect]);

  useEffect(() => {
    const faceToShow = faceRotationOrder[rotationOrderIndex];
    rotateToFace(faceToShow);
  }, [rotationOrderIndex, rotateToFace]);

  useEffect(() => {
    startAutoRotation();
    return stopAutoRotation;
  }, [startAutoRotation, stopAutoRotation]);

  const handleFaceClick = (brandIndex: number) => {
    stopAutoRotation();
    onSelect(brandIndex);

    // Find the correct rotation index for the clicked face
    const newRotationOrderIndex = faceRotationOrder.indexOf(brandIndex);
    if (newRotationOrderIndex !== -1) {
        setRotationOrderIndex(newRotationOrderIndex);
    } else {
        rotateToFace(brandIndex);
    }
    
    // Navigate to the quiz page after the animation
    const selectedBrand = brands[brandIndex];
    setTimeout(() => {
        router.push(`/quiz?brand=${selectedBrand.brand}&format=${selectedBrand.format}`);
    }, 750); // Match animation speed
  };
  
  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48 perspective">
        <div 
          ref={cubeRef} 
          className="w-full h-full relative preserve-3d"
          style={{ transition: 'transform 0.75s ease-in-out' }}
        >
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={() => handleFaceClick(index)}
              className="absolute w-32 h-32 left-[calc(50%-64px)] top-[calc(50%-64px)] rounded-lg border-2 backface-hidden cursor-pointer bg-black/30 backdrop-blur-md border-white/30 transition-all hover:bg-black/50 hover:border-white"
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
