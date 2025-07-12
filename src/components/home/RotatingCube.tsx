
'use client';

import React, { useRef } from 'react';
import { useLoader, useFrame } from '@react-three/fiber';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import type { Mesh } from 'three';
import * as THREE from 'three';
import type { CubeBrand } from './brandData';

export default function RotatingCube({ brands, visibleFaceIndex, onFaceClick, isRotating }: {
  brands: CubeBrand[];
  visibleFaceIndex: number;
  onFaceClick: (index: number) => void;
  isRotating: boolean;
}) {
  const meshRef = useRef<Mesh>(null!);
  const textures = useLoader(TextureLoader, brands.map(b => b.whiteLogoUrl));

  const targetRotation = useRef(new THREE.Quaternion()).current;

  // Map face index to the correct rotation for 'front' view
  const mapIndexToQuaternion = (index: number): THREE.Quaternion => {
    switch (index) {
        case 0: return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0)); // Front
        case 1: return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI / 2, 0)); // Right -> Left
        case 2: return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, -Math.PI, 0)); // Back
        case 3: return new THREE.Quaternion().setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)); // Left -> Right
        case 4: return new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)); // Top -> Bottom
        case 5: return new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)); // Bottom -> Top
        default: return new THREE.Quaternion();
    }
  }

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (isRotating) {
        // Gentle auto-rotation
        meshRef.current.rotation.y += delta * 0.2;
        meshRef.current.rotation.x += delta * 0.1;
    } else {
        // Smoothly interpolate to the target face
        targetRotation.copy(mapIndexToQuaternion(visibleFaceIndex));
        if (!meshRef.current.quaternion.equals(targetRotation)) {
            const step = 4 * delta;
            meshRef.current.quaternion.slerp(targetRotation, step);
        }
    }
  });

  const handleClick = (event: any) => {
    event.stopPropagation();
    // Determine clicked face
    const faceIndex = event.face?.materialIndex;
    if (faceIndex !== undefined) {
      onFaceClick(faceIndex);
    }
  }

  return (
    <mesh
      ref={meshRef}
      onClick={handleClick}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'auto')}
    >
      <boxGeometry args={[2, 2, 2]} />
      {textures.map((texture, i) => (
        <meshStandardMaterial
          key={brands[i].id}
          map={texture}
          attach={`material-${i}`}
          color="hsl(var(--primary))"
          emissive="hsl(var(--primary))"
          emissiveIntensity={0.1}
          roughness={0.4}
          metalness={0.6}
        />
      ))}
    </mesh>
  );
}
