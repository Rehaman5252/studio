
'use client';

import React from 'react';
import Image from 'next/image';
import { brandData, type CubeBrand } from './brandData';

interface BrandCubeProps {
  onFaceClick: (brand: CubeBrand) => void;
  rotation: { x: number; y: number };
}

const BrandCube = ({ onFaceClick, rotation }: BrandCubeProps) => {
  const faces = [
    { class: 'cube-face-front', brand: brandData[0], rotation: { x: 0, y: 0 } },
    { class: 'cube-face-right', brand: brandData[1], rotation: { x: 0, y: -90 } },
    { class: 'cube-face-back', brand: brandData[2], rotation: { x: 0, y: -180 } },
    { class: 'cube-face-left', brand: brandData[3], rotation: { x: 0, y: 90 } },
    { class: 'cube-face-top', brand: brandData[4], rotation: { x: -90, y: 0 } },
    { class: 'cube-face-bottom', brand: brandData[5], rotation: { x: 90, y: 0 } },
  ];

  const handleFaceClick = (e: React.MouseEvent, brand: CubeBrand) => {
    e.stopPropagation(); // Prevent the click from bubbling up if needed
    onFaceClick(brand);
  };

  return (
    <div className="scene">
      <div
        className="cube"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {faces.map((face) => (
          <button
            key={face.brand.id}
            className={`cube-face ${face.class}`}
            onClick={(e) => handleFaceClick(e, face.brand)}
            aria-label={`Play ${face.brand.format} Quiz`}
          >
             <div className="flex flex-col items-center justify-between p-2 text-inherit w-full h-full">
                <div className="w-full h-2/3 relative">
                    <Image
                        src={face.brand.logoUrl}
                        alt={`${face.brand.brand} logo`}
                        data-ai-hint="cricket logo"
                        fill
                        className="object-contain"
                        priority
                    />
                </div>
                <p className="font-bold text-lg text-inherit">{face.brand.format}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default BrandCube;
