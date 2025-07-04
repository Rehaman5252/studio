'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  color: string;
  bgColor: string;
  logoUrl: string;
  logoWidth: number;
  logoHeight: number;
}

const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', color: '#000000', bgColor: '#F5F5F5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', logoWidth: 40, logoHeight: 40 },
  { id: 2, brand: 'Myntra', format: 'WPL', color: '#FF3F6C', bgColor: '#FFF0F5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.png', logoWidth: 80, logoHeight: 20 },
  { id: 3, brand: 'SBI', format: 'Test', color: '#1E3A8A', bgColor: '#EBF8FF', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/SBI-logo.svg', logoWidth: 60, logoHeight: 60 },
  { id: 4, brand: 'Nike', format: 'ODI', color: '#FFFFFF', bgColor: '#000000', logoUrl: 'https://www.freepnglogos.com/uploads/nike-logo-png/nike-logo-white-png-21.png', logoWidth: 60, logoHeight: 30 },
  { id: 5, brand: 'Amazon', format: 'Mixed', color: '#FF9900', bgColor: '#232F3E', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg', logoWidth: 70, logoHeight: 25 },
  { id: 6, brand: 'Boat', format: 'IPL', color: '#FF6B35', bgColor: '#1A1A1A', logoUrl: 'https://cdn.shopify.com/s/files/1/0057/8938/4802/files/boAt_logo_small_3067da8c-a83b-46dd-bce9-1f00a120b017_180x.png', logoWidth: 80, logoHeight: 30 },
];

const faceTransforms = [
  'rotateY(0deg) translateZ(60px)', // Front
  'rotateY(90deg) translateZ(60px)', // Right
  'rotateY(180deg) translateZ(60px)', // Back
  'rotateY(-90deg) translateZ(60px)', // Left
  'rotateX(90deg) translateZ(60px)', // Top
  'rotateX(-90deg) translateZ(60px)', // Bottom
];

interface CubeProps {
  onSelect: (brand: string, format: string) => void;
}

export default function Cube({ onSelect }: CubeProps) {
  const [currentFace, setCurrentFace] = useState(0);
  const cubeRef = useRef<HTMLDivElement>(null);
  const autoRotateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    onSelect(brands[0].brand, brands[0].format);
    // Cleanup timeout on unmount
    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current);
      }
    };
  }, [onSelect]);

  const handleFaceClick = (index: number) => {
    setCurrentFace(index);
    onSelect(brands[index].brand, brands[index].format);
    if(cubeRef.current){
        const rotationMap = [
            'rotateY(0deg)',        // Front
            'rotateY(-90deg)',      // Right
            'rotateY(-180deg)',     // Back
            'rotateY(90deg)',       // Left
            'rotateX(-90deg)',      // Top
            'rotateX(90deg)',       // Bottom
        ];
        // Clear any existing animation interruption timeout
        if (autoRotateTimeoutRef.current) {
          clearTimeout(autoRotateTimeoutRef.current);
        }

        cubeRef.current.style.animation = 'none'; // Pause auto-rotation
        cubeRef.current.style.transform = rotationMap[index];
        
        // Resume animation after a delay
        autoRotateTimeoutRef.current = setTimeout(() => {
            if(cubeRef.current) {
              cubeRef.current.style.animation = ''; // Resume animation
            }
        }, 3000);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="w-48 h-48 perspective">
        <div ref={cubeRef} className="w-full h-full relative preserve-3d animate-cube-rotate">
          {brands.map((brand, index) => (
            <div
              key={brand.id}
              onClick={() => handleFaceClick(index)}
              className="absolute w-32 h-32 left-[calc(50%-64px)] top-[calc(50%-64px)] rounded-lg border-2 backface-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:shadow-2xl"
              style={{
                transform: faceTransforms[index],
                backgroundColor: `${brand.bgColor}CC`,
                borderColor: brand.color,
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
                <span className="text-xs" style={{ color: brand.color, opacity: 0.8 }}>
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
