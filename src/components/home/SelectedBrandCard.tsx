
'use client';

import React, { memo } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { CubeBrand } from '@/components/home/brandData';
import { cn } from '@/lib/utils';

interface SelectedBrandCardProps {
    selectedBrand: CubeBrand;
    onClick: () => void;
}

const SelectedBrandCard = ({ selectedBrand, onClick }: SelectedBrandCardProps) => {
    return (
        <div
            onClick={onClick}
            className="cursor-pointer"
            key={selectedBrand.id}
        >
            <Card 
                className={cn(
                    "w-full mt-4 rounded-2xl shadow-xl bg-card border-2 border-primary/30 overflow-hidden",
                    "transition-all hover:border-primary animate-fade-in-up"
                )}
            >
                <CardContent className="p-6">
                    <div
                        className="flex items-center justify-between"
                    >
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">{selectedBrand.format} Cricket Quiz</h3>
                            <p className="text-muted-foreground mb-2">Powered by {selectedBrand.brand}</p>
                            <p className="text-lg font-semibold text-primary">Win Rewards!</p>
                        </div>
                        <div className="w-20 h-20 rounded-full flex items-center justify-center p-2 shadow-inner bg-white">
                            <Image
                                src={selectedBrand.logoUrl}
                                alt={`${selectedBrand.brand} logo`}
                                data-ai-hint="cricket logo"
                                width={selectedBrand.logoWidth || 80}
                                height={selectedBrand.logoHeight || 80}
                                className="object-contain"
                                priority
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default memo(SelectedBrandCard);
