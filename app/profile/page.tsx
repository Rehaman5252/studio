
'use client';
import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import ClientOnly from '@/components/ClientOnly';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { User } from 'lucide-react';

const ProfilePageContent = dynamic(() => import('@/components/profile/ProfilePageContent'), {
  loading: () => <ProfileSkeleton />,
  ssr: false,
});


function ProfilePage() {
    const { user, loading, profile } = useAuth();

    return (
        <PageWrapper title="Player's Pavilion">
            <ClientOnly>
              {loading ? (
                <ProfileSkeleton />
              ) : user && profile ? (
                <ProfilePageContent />
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
