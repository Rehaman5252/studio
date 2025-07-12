
'use client';

import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import Image from 'next/image';
import type { CubeBrand } from '@/components/home/brandData';
import { brands } from '@/components/home/brandData';

interface CubeProps {
  onFaceClick: (brand: CubeBrand) => void;
}

const Face: React.FC<{ position: [number, number, number], rotation: [number, number, number], brand: CubeBrand, onClick: (brand: CubeBrand) => void }> = ({ position, rotation, brand, onClick }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[2.5, 2.5]} />
      <meshStandardMaterial color="#111" />
      <Html center transform>
        <div 
          className="w-24 h-24 flex items-center justify-center cursor-pointer p-2 rounded-lg transition-all duration-300 hover:bg-white/10"
          onClick={(e) => {
            e.stopPropagation();
            onClick(brand);
          }}
        >
          <Image 
            src={brand.logoUrl} 
            alt={`${brand.brand} logo`}
            width={brand.logoWidth || 80}
            height={brand.logoHeight || 80}
            className="object-contain"
            style={{ filter: brand.invertOnDark ? 'invert(1)' : 'none' }}
          />
        </div>
      </Html>
    </mesh>
  );
};


const CubeFaces = ({ onFaceClick }: { onFaceClick: (brand: CubeBrand) => void }) => {
    const facePositions: [number, number, number][] = [
        [0, 0, 1.25],  // front
        [0, 0, -1.25], // back
        [1.25, 0, 0],  // right
        [-1.25, 0, 0], // left
        [0, 1.25, 0],  // top
        [0, -1.25, 0], // bottom
    ];

    const faceRotations: [number, number, number][] = [
        [0, 0, 0],
        [0, Math.PI, 0],
        [0, Math.PI / 2, 0],
        [0, -Math.PI / 2, 0],
        [-Math.PI / 2, 0, 0],
        [Math.PI / 2, 0, 0],
    ];

    return (
        <group>
            {brands.map((brand, index) => (
                <Face 
                    key={brand.id} 
                    position={facePositions[index]} 
                    rotation={faceRotations[index]} 
                    brand={brand} 
                    onClick={onFaceClick} 
                />
            ))}
        </group>
    );
};

export default function Cube({ onFaceClick }: CubeProps) {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={1.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Suspense fallback={null}>
           <CubeFaces onFaceClick={onFaceClick} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={1.5} />
    </Canvas>
  );
}
