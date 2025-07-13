
'use client';

import React from 'react';
import Image from 'next/image';
import { brandData } from './brandData';

interface BrandCubeProps {
  rotation: number;
}

const BrandCube = ({ rotation }: BrandCubeProps) => {
  const faces = [
    { class: 'cube-face-front', brand: brandData[0] },
    { class: 'cube-face-right', brand: brandData[1] },
    { class: 'cube-face-back', brand: brandData[2] },
    { class: 'cube-face-left', brand: brandData[3] },
    { class: 'cube-face-top', brand: brandData[4] },
    { class: 'cube-face-bottom', brand: brandData[5] },
  ];

  return (
    <div className="scene h-52 w-full flex items-center justify-center mb-8">
      <div
        className="cube"
        style={{ transform: `rotateY(${rotation}deg) rotateX(-15deg)` }}
      >
        {faces.map((face) => (
          <div key={face.brand.id} className={`cube-face ${face.class}`}>
             <div className="w-24 h-24 rounded-full flex items-center justify-center p-2 shadow-inner bg-white">
                <Image
                    src={face.brand.logoUrl}
                    alt={`${face.brand.brand} logo`}
                    data-ai-hint="cricket logo"
                    width={face.brand.logoWidth * 1.5}
                    height={face.brand.logoHeight * 1.5}
                    className="object-contain"
                    priority
                />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandCube;
