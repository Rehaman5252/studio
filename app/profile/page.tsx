
"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import ProfileSkeleton from '@/app/components/profile/ProfileSkeleton';
import PageWrapper from "@/app/components/PageWrapper";
import AuthGuard from "@/app/components/auth/AuthGuard";

const ProfilePageContent = dynamic(() => import('@/app/components/profile/ProfilePageContent'), {
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
