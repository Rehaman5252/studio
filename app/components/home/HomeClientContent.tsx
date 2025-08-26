
'use client';

import React, { memo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import QuizSelection from '@/components/home/QuizSelection';
import GuidedTour from '@/components/home/GuidedTour';
import type { CubeBrand } from './brandData';

interface HomeClientContentProps {
    selectedBrand: CubeBrand;
    setSelectedBrand: React.Dispatch<React.SetStateAction<CubeBrand>>;
    handleStartQuiz: (brand: CubeBrand) => void;
}

const HomeClientContentComponent = ({ selectedBrand, setSelectedBrand, handleStartQuiz }: HomeClientContentProps) => {
    const { profile, updateUserData } = useAuth();

    const needsTour = profile && !profile.guidedTourCompleted;

    const handleTourFinish = async () => {
        if (profile) {
            try {
                await updateUserData({ guidedTourCompleted: true });
            } catch (error) {
                console.error("Failed to update tour status:", error);
            }
        }
    };
    
    return (
        <>
            <QuizSelection
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand} 
                handleStartQuiz={handleStartQuiz} 
            />
            {profile && <GuidedTour run={needsTour} onFinish={handleTourFinish} />}
        </>
    );
};

export default memo(HomeClientContentComponent);
