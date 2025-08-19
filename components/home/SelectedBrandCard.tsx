
'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { CubeBrand } from './brandData';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

interface SelectedBrandCardProps {
  selectedBrand: CubeBrand;
  onClick: () => void;
}

const SelectedBrandCard = ({ selectedBrand, onClick }: SelectedBrandCardProps) => {
  return (
    <motion.div
        key={selectedBrand.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2 }}
    >
        <Card 
            className="rounded-2xl shadow-lg cursor-pointer hover:bg-secondary/50 transition-colors border-primary/20"
            onClick={onClick}
            role="button"
            aria-label={`Play ${selectedBrand.format} quiz`}
        >
            <CardContent className="px-20 py-4 flex items-center justify-between gap-4">
                <div className="flex-1 text-left">
                    <h3 className="font-bold text-lg text-foreground">{selectedBrand.format} Quiz</h3>
                    <p className="text-sm text-muted-foreground">{selectedBrand.description}</p>
                </div>
                <div className="relative w-28 h-24 flex-shrink-0">
                    <Image
                        src={selectedBrand.logoUrl}
                        alt={`${selectedBrand.brand} Logo`}
                        data-ai-hint={`${selectedBrand.brand} logo`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </div>
            </CardContent>
        </Card>
    </motion.div>
  );
};

export default memo(SelectedBrandCard);
