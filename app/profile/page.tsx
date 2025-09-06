
"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import PageWrapper from "@/components/PageWrapper";
import AuthGuard from "@/components/auth/AuthGuard";

const ProfilePageContent = dynamic(() => import('@/components/profile/ProfilePageContent'), {
  loading: () => <ProfileSkeleton />,
  ssr: false,
});

export default function ProfilePage() {
  return (
    <PageWrapper title="Player's Pavilion">
        <AuthGuard>
            <Suspense fallback={<ProfileSkeleton />}>
              <ProfilePageContent />
            </Suspense>
        </AuthGuard>
    </PageWrapper>
  );
}
