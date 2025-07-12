
'use client';

import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import type { CubeBrand } from '@/components/home/brandData';
import * as THREE from 'three';
import Image from 'next/image';

interface CubeProps {
  brands: CubeBrand[];
  onFaceClick: (brand: CubeBrand) => void;
}

export default function Cube({ brands, onFaceClick }: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state, delta) => {
    // This is handled by OrbitControls autoRotate
  });

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2.5, 2.5, 2.5]} />
      {brands.map((brand, index) => (
         <meshStandardMaterial key={index} attach={`material-${index}`} color="black">
           <Html center>
              <div 
                className="w-24 h-24 flex flex-col items-center justify-center cursor-pointer"
                onClick={() => onFaceClick(brand)}
              >
                <Image 
                    src={brand.logoUrl} 
                    alt={`${brand.brand} logo`}
                    width={brand.logoWidth || 60}
                    height={brand.logoHeight || 60}
                    className="object-contain"
                    style={{ filter: brand.invertOnDark ? 'invert(1)' : 'none' }}
                 />
              </div>
           </Html>
         </meshStandardMaterial>
      ))}
    </mesh>
  );
}
