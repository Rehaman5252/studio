
'use client';

import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import LoginPrompt from '@/components/auth/LoginPrompt';
import LoadingSpinner from '@/app/components/ui/LoadingSpinner';
import { User } from 'lucide-react';
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import ProfilePageContent from '@/components/profile/ProfilePageContent';

function ProfilePage() {
    const { user, loading } = useAuth();

    return (
        <PageWrapper title="Player's Pavilion">
            <ClientOnly>
              {loading ? (
                <ProfileSkeleton />
              ) : user ? (
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
