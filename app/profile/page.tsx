
"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import PageWrapper from "@/components/PageWrapper";
import AuthGuard from "@/components/auth/AuthGuard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";


const ProfilePageContent = dynamic(
    async () => {
        try {
            return await import('@/components/profile/ProfilePageContent');
        } catch (e) {
            console.error("Failed to load ProfilePageContent", e);
            return () => (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>Failed to load profile content. Please refresh the page.</AlertDescription>
                </Alert>
            )
        }
    },
    {
        loading: () => <ProfileSkeleton />,
        ssr: false,
    }
);

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
