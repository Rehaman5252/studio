
'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import RotatingCube from './RotatingCube';
import type { CubeBrand } from './brandData';

interface SceneProps {
    brands: CubeBrand[];
    visibleFaceIndex: number;
    onFaceClick: (index: number) => void;
    isRotating: boolean;
}

export default function Scene({ brands, visibleFaceIndex, onFaceClick, isRotating }: SceneProps) {
  return (
    <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />
      <pointLight position={[0, 10, 5]} intensity={0.8} />

      <RotatingCube
        brands={brands}
        visibleFaceIndex={visibleFaceIndex}
        onFaceClick={onFaceClick}
        isRotating={isRotating}
      />
      
      {/* OrbitControls allows manual rotation for debugging/interaction, can be disabled */}
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={3 * Math.PI / 4}
      />
    </Canvas>
  );
}
