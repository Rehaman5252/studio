
"use client";
import React, { Suspense } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCheck, ServerCrash, WifiOff, Settings, Scale, LogOut } from 'lucide-react';
import { useAuth } from "@/context/AuthProvider";
import LoginPrompt from "@/components/auth/LoginPrompt";
import { Button } from "@/components/ui/button";
import SupportCard from "@/components/profile/SupportCard";
import { useRouter } from "next/navigation";
import { memo } from 'react';

const ProfileContent = dynamic(() => import('@/components/profile/ProfileContent'), {
  loading: () => <ProfileSkeleton />,
  ssr: false,
});

function ProfilePageContent() {
  const { user, profile, loading, isOffline, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };
  
  const renderPrivateContent = () => {
    if (loading) {
      return <ProfileSkeleton />;
    }

    if (!user) {
       return (
         <div className="w-full">
             <LoginPrompt
                icon={UserCheck}
                title="Ready to Step up to the Crease?"
                description="Pad up and sign in to view your player stats, achievements, and rewards."
             />
         </div>
       );
    }

    if (isOffline && !profile) {
        return (
            <Alert variant="destructive" className="max-w-md">
                <WifiOff className="h-4 w-4" />
                <AlertTitle>Could Not Load Profile</AlertTitle>
                <AlertDescription>
                    You appear to be offline. Please check your connection to view your profile.
                </AlertDescription>
            </Alert>
        )
    }
    
    if (!profile) {
        return (
            <Alert variant="destructive" className="max-w-md">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Profile Not Found</AlertTitle>
                <AlertDescription>
                    No profile data was found. Please complete your profile to continue.
                    <Button asChild className="mt-4 w-full">
                        <Link href="/complete-profile">Complete Profile</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }
    
    // Render the user-specific components
    return <ProfileContent userProfile={profile} />;
  }

  return (
    <div
      className="flex flex-col min-h-screen bg-background animate-fade-in-up"
    >
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-center">
        <h1 className="text-2xl font-bold text-foreground">Player's Pavilion</h1>
      </header>
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <Suspense fallback={<ProfileSkeleton />}>
          {renderPrivateContent()}
        </Suspense>

        <section className="space-y-3 pt-4">
           <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
              <Link href="/settings" prefetch={true}><Settings className="mr-4" /> App Settings</Link>
          </Button>
          <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
              <Link href="/policies" prefetch={true}><Scale className="mr-4" /> Legal & Policies</Link>
          </Button>
        </section>

        <SupportCard />

        {user && (
          <section>
              <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                  <LogOut className="mr-2 h-5 w-5" /> Logout
              </Button>
          </section>
        )}
      </main>
    </div>
  );
}

const MemoizedProfilePageContent = memo(ProfilePageContent);

export default function ProfilePage() {
    return <MemoizedProfilePageContent />;
}
