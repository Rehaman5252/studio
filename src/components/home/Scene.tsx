
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
    <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }} shadows>
      <ambientLight intensity={1.2} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1.5} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, -10, -5]} intensity={0.7} />
      <pointLight position={[0, 10, 5]} intensity={1} />
      
      <RotatingCube
        brands={brands}
        visibleFaceIndex={visibleFaceIndex}
        onFaceClick={onFaceClick}
        isRotating={isRotating}
      />
      
      <OrbitControls 
        enableZoom={false} 
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={3 * Math.PI / 4}
      />
    </Canvas>
  );
}
