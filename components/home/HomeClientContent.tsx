
'use client';

import React, { memo } from 'react';
import { useAuth } from '@/context/AuthProvider';
import type { CubeBrand } from './brandData';
import dynamic from 'next/dynamic';
import { Skeleton } from '../ui/skeleton';

const QuizSelection = dynamic(() => import('@/components/home/QuizSelection'), {
    loading: () => <Skeleton className="h-[450px] w-full" />,
    ssr: false
});
const GuidedTour = dynamic(() => import('@/components/home/GuidedTour'), { ssr: false });

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
