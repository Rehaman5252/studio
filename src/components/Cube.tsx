
'use client';

import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three';
import { useTexture } from '@react-three/drei';
import type { CubeBrand } from '@/components/home/brandData';
import * as THREE from 'three';

interface CubeProps {
  brands: CubeBrand[];
  onFaceClick: (brand: CubeBrand) => void;
}

const faceMaterials = (textures: (THREE.Texture | null)[]) => {
  return textures.map(texture => {
    if (texture) {
        return new THREE.MeshStandardMaterial({ map: texture, transparent: true });
    }
    return new THREE.MeshStandardMaterial({ color: 'black' });
  });
};

export default function Cube({ brands, onFaceClick }: CubeProps) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [hoveredFace, setHoveredFace] = useState<number | null>(null);

  const logoUrls = brands.map(b => b.logoUrl);
  const textures = useTexture(logoUrls);

  useFrame((state, delta) => {
    // You can add animations here if needed, but auto-rotate is handled by OrbitControls
    if (meshRef.current) {
        // Example: meshRef.current.rotation.y += delta * 0.1;
    }
  });

  const handleClick = (event: any) => {
    if (event.faceIndex !== undefined) {
      const faceIndex = Math.floor(event.faceIndex / 2);
      onFaceClick(brands[faceIndex]);
    }
  };

  const materials = React.useMemo(() => {
    return brands.map(brand => {
      const texture = new TextureLoader().load(brand.logoUrl);
      return new THREE.MeshStandardMaterial({
        map: texture,
        color: 'white',
        transparent: true
      });
    });
  }, [brands]);

  return (
    <mesh ref={meshRef} onClick={handleClick}>
      <boxGeometry args={[2.5, 2.5, 2.5]} />
      {materials.map((material, index) => (
        <primitive key={index} attach={`material-${index}`} object={material} />
      ))}
    </mesh>
  );
}
