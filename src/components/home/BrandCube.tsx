
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
    <div className="scene h-full w-full">
      <div
        className="cube"
        style={{ transform: `rotateY(${rotation}deg) rotateX(-15deg)` }}
      >
        {faces.map((face) => (
          <div key={face.brand.id} className={`cube-face ${face.class}`}>
             <div className="flex flex-col items-center justify-between p-2 text-white w-full h-full">
                <div className="w-full h-2/3 relative">
                    <Image
                        src={face.brand.logoUrl}
                        alt={`${face.brand.brand} logo`}
                        data-ai-hint="cricket logo"
                        fill
                        className="object-contain opacity-75"
                        priority
                    />
                </div>
                <p className="font-bold text-lg text-primary">{face.brand.format}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrandCube;
