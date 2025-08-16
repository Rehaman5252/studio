
'use client';

import React, { memo } from 'react';
import QuizSelection from '@/components/home/QuizSelection';
import { useAuth } from '@/context/AuthProvider';
import GuidedTour from '@/components/home/GuidedTour';
import { useRouter } from 'next/navigation';

const HomeClientContentComponent = () => {
    const { profile, updateUserData } = useAuth();
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
    
    return (
        <>
            <QuizSelection />
            {profile && <GuidedTour run={needsTour} onFinish={handleTourFinish} />}
        </>
    );
};

const HomeClientContent = memo(HomeClientContentComponent);
export default HomeClientContent;
