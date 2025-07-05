
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { CubeBrand } from '@/components/Cube';

interface SelectedBrandCardProps {
    selectedBrand: CubeBrand;
    handleStartQuiz: (brand: string, format: string) => void;
}

const SelectedBrandCard = ({ selectedBrand, handleStartQuiz }: SelectedBrandCardProps) => {
    return (
        <div
            key={selectedBrand.id}
            onClick={() => handleStartQuiz(selectedBrand.brand, selectedBrand.format)}
            className="cursor-pointer"
        >
            <Card 
                className="w-full mt-8 rounded-2xl shadow-xl bg-card border-2 border-primary/30 transition-colors hover:border-primary"
            >
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-foreground">{selectedBrand.format} Cricket Quiz</h3>
                            <p className="text-muted-foreground mb-2">Sponsored by {selectedBrand.brand}</p>
                            <p className="text-lg font-semibold text-primary">Win Rewards!</p>
                        </div>
                        <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white p-2 shadow-inner">
                            <Image
                                src={selectedBrand.logoUrl}
                                alt={`${selectedBrand.brand} logo`}
                                width={selectedBrand.logoWidth < 50 ? selectedBrand.logoWidth * 1.2 : selectedBrand.logoWidth}
                                height={selectedBrand.logoHeight < 50 ? selectedBrand.logoHeight * 1.2 : selectedBrand.logoHeight}
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

export default SelectedBrandCard;
