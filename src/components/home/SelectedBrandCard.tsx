
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { CubeBrand } from '@/components/home/brandData';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SelectedBrandCardProps {
    selectedBrand: CubeBrand;
    onClick: () => void;
}

const SelectedBrandCard = ({ selectedBrand, onClick }: SelectedBrandCardProps) => {
    const textAnimationVariants = {
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 20 },
    };

    return (
        <div
            onClick={onClick}
            className="cursor-pointer"
        >
            <Card 
                className={cn(
                    "w-full mt-4 rounded-2xl shadow-xl bg-card border-2 border-primary/30 overflow-hidden",
                    "transition-all hover:border-primary"
                )}
            >
                <CardContent className="p-6 relative h-[136px] flex items-center justify-between w-full">
                    {/* Left side with animated text */}
                    <div className="flex-1 overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${selectedBrand.id}-text`}
                                variants={textAnimationVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                            >
                                <h3 className="text-xl font-bold text-foreground">{selectedBrand.format} Cricket Quiz</h3>
                                <p className="text-sm text-muted-foreground">Powered by {selectedBrand.brand}</p>
                            </motion.div>
                        </AnimatePresence>
                        {/* Stable "Win Rewards!" text */}
                        <p className="text-lg font-extrabold text-primary mt-2">Win Rewards!</p>
                    </div>

                    {/* Right side with stable circle and animated logo */}
                    <div className="w-20 h-20 rounded-full flex items-center justify-center p-2 shadow-inner bg-white relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${selectedBrand.id}-logo`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                                className="absolute inset-0 flex items-center justify-center"
                            >
                                <Image
                                    src={selectedBrand.logoUrl}
                                    alt={`${selectedBrand.brand} logo`}
                                    data-ai-hint="cricket logo"
                                    width={selectedBrand.logoWidth || 80}
                                    height={selectedBrand.logoHeight || 80}
                                    className="object-contain"
                                    priority
                                />
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default memo(SelectedBrandCard);
