'use client';

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface CubeBrand {
  id: number;
  brand: string;
  format: string;
  color: string;
  bgColor: string;
  icon: string;
}

const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', color: '#000000', bgColor: '#F5F5F5', icon: '🍎' },
  { id: 2, brand: 'Myntra', format: 'WPL', color: '#FF3F6C', bgColor: '#FFF0F5', icon: '👗' },
  { id: 3, brand: 'SBI', format: 'Test', color: '#1E3A8A', bgColor: '#EBF8FF', icon: '🏦' },
  { id: 4, brand: 'Nike', format: 'ODI', color: '#FFFFFF', bgColor: '#1F2937', icon: '👟' },
  { id: 5, brand: 'Amazon', format: 'Mixed', color: '#FF9900', bgColor: '#232F3E', icon: '📦' },
  { id: 6, brand: 'Boat', format: 'IPL', color: '#FF6B35', bgColor: '#1A1A1A', icon: '🎧' },
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

  useEffect(() => {
    onSelect(brands[0].brand, brands[0].format);
  }, [onSelect]);

  const handleFaceClick = (index: number) => {
    setCurrentFace(index);
    onSelect(brands[index].brand, brands[index].format);
    if(cubeRef.current){
        const rotationMap = [
            'rotateY(0deg)',
            'rotateY(-90deg)',
            'rotateY(-180deg)',
            'rotateY(90deg)',
            'rotateX(-90deg)',
            'rotateX(90deg)',
        ];
        cubeRef.current.style.animation = 'none'; // Pause auto-rotation
        cubeRef.current.style.transform = `rotateX(-15deg) ${rotationMap[index]}`;
        setTimeout(() => {
            if(cubeRef.current) cubeRef.current.style.animation = ''; // Resume
        }, 3000)
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
              <div className="flex flex-col items-center justify-center h-full text-center p-2">
                <span className="text-3xl">{brand.icon}</span>
                <span className="text-sm font-bold mt-1" style={{ color: brand.color }}>
                  {brand.brand}
                </span>
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