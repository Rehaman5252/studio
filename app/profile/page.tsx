
'use client';

import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import LoginPrompt from '@/app/components/auth/LoginPrompt';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';

const ProfileHeader = dynamic(() => import('@/app/components/profile/ProfileHeader'), { loading: () => <LoadingSpinner /> });
const ProfilePageContent = dynamic(() => import('@/app/components/profile/ProfilePageContent'), { loading: () => <LoadingSpinner /> });

function ProfilePage() {
    const { user, loading, profile } = useAuth();

    return (
        <PageWrapper title="Player's Pavilion">
            <ClientOnly>
              {loading ? (
                <LoadingSpinner className="h-96"/>
              ) : user && profile ? (
                <div className="space-y-4">
                  <ProfileHeader userProfile={profile} />
                  <ProfilePageContent />
                </div>
              ) : (
                <div className="pt-8">
                  <LoginPrompt 
                    icon={User}
                    title="Ready to Step Up to the Crease?"
                    description="Sign in to view your profile, track stats, and climb the leaderboard."
                  />
                </div>
              )}
            </ClientOnly>
        </PageWrapper>
    );
}

export default memo(ProfilePage);
