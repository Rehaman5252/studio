
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import QuizSelection from '@/components/home/QuizSelection';
import GuidedTour from '@/components/home/GuidedTour';
import type { CubeBrand } from './brandData';

interface HomeClientContentProps {
    selectedBrand: CubeBrand;
    setSelectedBrand: React.Dispatch<React.SetStateAction<CubeBrand>>;
}

const HomeClientContent = ({ selectedBrand, setSelectedBrand }: HomeClientContentProps) => {
    const { user, profile, updateUserData, isProfileComplete, lastAttemptInSlot } = useAuth();
    const router = useRouter();

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
    
    const handleStartQuiz = (brandToPlay?: CubeBrand) => {
        const brand = brandToPlay || selectedBrand;
        if (!user) {
            router.push(`/auth/login?from=/`);
            return;
        }
        
        if (lastAttemptInSlot) {
            const attemptDataString = btoa(JSON.stringify(lastAttemptInSlot));
            router.push(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);
            return;
        }

        if (!isProfileComplete) {
             // The QuizSelection component shows an alert dialog for this case.
            return;
        }
        
        router.push(`/quiz?brand=${encodeURIComponent(brand.brand)}&format=${encodeURIComponent(brand.format)}`);
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

export default HomeClientContent;
