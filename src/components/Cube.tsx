
'use client';

import React from 'react';
import Image from 'next/image';
import type { CubeBrand } from '@/components/home/brandData';
import { brands } from '@/components/home/brandData';
import { Card, CardContent } from '@/components/ui/card';

interface CubeProps {
  onFaceClick: (brand: CubeBrand) => void;
}

export default function Cube({ onFaceClick }: CubeProps) {
  return (
    <div className="grid grid-cols-3 gap-4 p-4">
      {brands.map((brand) => (
        <Card
          key={brand.id}
          className="aspect-square flex items-center justify-center p-2 cursor-pointer transition-transform hover:scale-105"
          onClick={() => onFaceClick(brand)}
        >
          <CardContent className="p-0">
            <Image
              src={brand.logoUrl}
              alt={`${brand.brand} logo`}
              width={brand.logoWidth || 80}
              height={brand.logoHeight || 80}
              className="object-contain"
              style={{ filter: brand.invertOnDark ? 'invert(1)' : 'none' }}
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
