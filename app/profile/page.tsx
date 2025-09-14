
"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import PageWrapper from "@/components/PageWrapper";
import AuthGuard from "@/components/auth/AuthGuard";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";


const ProfilePageContent = dynamic(
    () => import('@/components/profile/ProfilePageContent').catch(e => {
        console.error("Failed to load ProfilePageContent", e);
        return function ChunkLoadFallback() {
             return (
                 <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Profile</AlertTitle>
                    <AlertDescription>
                        There was a problem loading your profile. Please check your connection and try again.
                         <Button variant="secondary" size="sm" onClick={() => window.location.reload()} className="mt-2">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Refresh
                        </Button>
                    </AlertDescription>
                </Alert>
            );
        }
    }),
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
