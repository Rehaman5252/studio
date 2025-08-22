
'use client';

import { memo } from 'react';
import Image from 'next/image';
import type { CubeBrand } from './brandData';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedBrandCardProps {
  selectedBrand: CubeBrand;
  onClick: () => void;
}

const SelectedBrandCardComponent = ({ selectedBrand, onClick }: SelectedBrandCardProps) => {
  return (
    <AnimatePresence mode="wait">
        <motion.div
            key={selectedBrand.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            <Card 
                className="rounded-2xl shadow-lg cursor-pointer bg-card/50 hover:bg-secondary/50 transition-all duration-300 ease-in-out border-primary/20 hover:border-primary/40 transform hover:-translate-y-1"
                onClick={onClick}
                role="button"
                aria-label={`Play ${selectedBrand.format} quiz`}
            >
                <CardContent className="px-4 py-4 sm:px-6 flex items-center justify-between gap-4">
                    <div className="flex-1 text-left space-y-1">
                        <h3 className="font-bold text-lg text-foreground">{selectedBrand.format} Quiz</h3>
                        <p className="text-sm text-muted-foreground">{selectedBrand.description}</p>
                        <p className="text-xs text-muted-foreground">Sponsored by <span className="font-semibold">{selectedBrand.brand}</span></p>
                        <p className="font-bold text-accent">Win Rewards!</p>
                    </div>
                    <div className="relative w-24 h-20 sm:w-28 sm:h-24 flex-shrink-0">
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
    </AnimatePresence>
  );
};

export default memo(SelectedBrandCardComponent);
