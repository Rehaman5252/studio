
"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import PageWrapper from "@/components/PageWrapper";
import { useAuth } from "@/context/AuthProvider";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, RefreshCw, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import LoginPrompt from "@/components/auth/LoginPrompt";
import SupportCard from "@/components/profile/SupportCard";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import Link from "next/link";


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


const LoggedOutProfileView = () => (
    <div className="space-y-4">
        <LoginPrompt
            icon={UserIcon}
            title="Step into the Player's Pavilion"
            description="Sign in to view your profile, track stats, and manage your account."
        />
        <section className="space-y-3 pt-4">
          <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
              <Link href="/settings">
                  <div className="flex items-center">
                      <Settings className="mr-4 text-primary" /> App Settings
                  </div>
                  <ChevronRight/>
              </Link>
          </Button>
          <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
              <Link href="/policies">
                  <div className="flex items-center">
                      <Scale className="mr-4 text-primary" /> Legal & Policies
                  </div>
                  <ChevronRight/>
              </Link>
          </Button>
      </section>
      <SupportCard />
    </div>
);


export default function ProfilePage() {
    const { user, loading } = useAuth();
    
    const renderContent = () => {
        if (loading) {
            return <ProfileSkeleton />;
        }
        if (user) {
            return <ProfilePageContent />;
        }
        return <LoggedOutProfileView />;
    }

    return (
        <PageWrapper title="Player's Pavilion">
            <Suspense fallback={<ProfileSkeleton />}>
                {renderContent()}
            </Suspense>
        </PageWrapper>
    );
}
