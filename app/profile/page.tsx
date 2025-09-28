
'use client';

import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import LoginPrompt from '@/components/auth/LoginPrompt';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileHeader = dynamic(() => import('@/components/profile/ProfileHeader'), { loading: () => <Skeleton className="h-28 w-full" /> });
const ProfilePageContent = dynamic(() => import('@/components/profile/ProfilePageContent'), { loading: () => <Skeleton className="h-96 w-full" /> });
const DailyStreakCard = dynamic(() => import('@/components/profile/DailyStreakCard'), { loading: () => <Skeleton className="h-24 w-full" /> });
const ProfileStats = dynamic(() => import('@/components/profile/ProfileStats'), { loading: () => <Skeleton className="h-24 w-full" /> });
const ReferralCard = dynamic(() => import('@/components/profile/ReferralCard'), { loading: () => <Skeleton className="h-48 w-full" /> });
const ProfileCompletion = dynamic(() => import('@/components/profile/ProfileCompletion'), { loading: () => <Skeleton className="h-24 w-full" /> });


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
                  <ProfileCompletion />
                  <DailyStreakCard userProfile={profile} />
                  <ProfileStats />
                  <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />
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
