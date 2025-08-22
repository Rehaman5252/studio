
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
    <Card 
        className="rounded-2xl shadow-lg cursor-pointer bg-card/50 hover:bg-secondary/50 transition-colors duration-300 ease-in-out transform hover:-translate-y-1 border-0"
        onClick={onClick}
        role="button"
        aria-label={`Play ${selectedBrand.format} quiz`}
    >
        <CardContent className="px-4 py-4 sm:px-6 flex items-center justify-between gap-4 overflow-hidden h-[124px]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${selectedBrand.id}-text`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="flex-1 text-left space-y-1"
                >
                    <h3 className="font-bold text-lg text-foreground">{selectedBrand.format} Quiz</h3>
                    <p className="text-sm text-muted-foreground">{selectedBrand.description}</p>
                    <p className="text-xs text-muted-foreground">Sponsored by <span className="font-semibold">{selectedBrand.brand}</span></p>
                    <p className="font-bold text-accent">Win Rewards!</p>
                </motion.div>
            </AnimatePresence>
            <AnimatePresence mode="wait">
                 <motion.div
                    key={`${selectedBrand.id}-image`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.35, ease: 'easeInOut' }}
                    className="relative w-24 h-20 sm:w-28 sm:h-24 flex-shrink-0"
                >
                    <Image
                        src={selectedBrand.logoUrl}
                        alt={`${selectedBrand.brand} Logo`}
                        data-ai-hint={`${selectedBrand.brand} logo`}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                </motion.div>
            </AnimatePresence>
        </CardContent>
    </Card>
  );
};

export default memo(SelectedBrandCardComponent);
