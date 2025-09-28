
'use client';

import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import ClientOnly from '@/components/ClientOnly';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { User } from 'lucide-react';
import ProfilePageContent from '@/components/profile/ProfilePageContent';

const ProfileHeader = dynamic(() => import('@/components/profile/ProfileHeader'), { loading: () => <ProfileSkeleton /> });
const ProfileCompletion = dynamic(() => import('@/components/profile/ProfileCompletion'), { loading: () => <ProfileSkeleton /> });
const ProfileStats = dynamic(() => import('@/components/profile/ProfileStats'), { loading: () => <ProfileSkeleton /> });
const ReferralCard = dynamic(() => import('@/components/profile/ReferralCard'), { loading: () => <ProfileSkeleton /> });
const DailyStreakCard = dynamic(() => import('@/components/profile/DailyStreakCard'), { loading: () => <ProfileSkeleton /> });

function ProfilePage() {
    const { user, loading, profile } = useAuth();

    return (
        <PageWrapper title="Player's Pavilion">
            <ClientOnly>
              {loading ? (
                <ProfileSkeleton />
              ) : user && profile ? (
                <div className="space-y-4">
                  <ProfileHeader userProfile={profile} />
                  <ProfileCompletion />
                  <DailyStreakCard userProfile={profile} />
                  <ProfileStats />
                  <ReferralCard referralCode={profile.referralCode || ''} referralEarnings={profile.referralEarnings || 0} />
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
