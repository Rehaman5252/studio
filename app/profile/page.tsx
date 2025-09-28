
'use client';

import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import LoginPrompt from '@/app/components/auth/LoginPrompt';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ProfilePageContent from '@/app/components/profile/ProfilePageContent';
import DailyStreakCard from '@/app/components/profile/DailyStreakCard';
import ProfileStats from '@/app/components/profile/ProfileStats';
import ReferralCard from '@/app/components/profile/ReferralCard';

const ProfileHeader = dynamic(() => import('@/app/components/profile/ProfileHeader'), { loading: () => <Skeleton className="h-28 w-full" /> });

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
                    <DailyStreakCard userProfile={profile} />
                    <ProfileStats />
                    <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />
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
