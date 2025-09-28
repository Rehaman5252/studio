
'use client';
import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import ClientOnly from '@/components/ClientOnly';

const ProfilePageContent = dynamic(() => import('@/components/profile/ProfilePageContent'), {
  loading: () => <ProfileSkeleton />,
  ssr: false,
});


function ProfilePage() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <PageWrapper title="Player's Pavilion">
                <ProfileSkeleton />
            </PageWrapper>
        );
    }
    
    return (
        <PageWrapper title="Player's Pavilion">
            <ClientOnly>
              <ProfilePageContent />
            </ClientOnly>
        </PageWrapper>
    );
}

export default memo(ProfilePage);
