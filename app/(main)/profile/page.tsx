
"use client";
import React, { Suspense, memo } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCheck, ServerCrash, WifiOff, Settings, Scale, LogOut, ChevronRight, Award, Edit } from 'lucide-react';
import { useAuth } from "@/context/AuthProvider";
import LoginPrompt from "@/components/auth/LoginPrompt";
import { Button } from "@/components/ui/button";
import SupportCard from "@/components/profile/SupportCard";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import { EditProfileDialog } from "@/components/profile/EditProfileDialog";
import CommentaryButton from "@/components/profile/CommentaryButton";

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
         <div className="w-full pt-8">
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
            <Alert variant="destructive" className="max-w-md mx-auto">
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
            <Alert variant="destructive" className="max-w-md mx-auto">
                <ServerCrash className="h-4 w-4" />
                <AlertTitle>Profile Not Found</AlertTitle>
                <AlertDescription>
                    We couldn't find your profile data. Please complete your profile to continue.
                    <Button asChild className="mt-4 w-full">
                        <Link href="/profile">Complete Profile</Link>
                    </Button>
                </AlertDescription>
            </Alert>
        )
    }
    
    // Render the user-specific components
    return <ProfileContent userProfile={profile} />;
  }

  const actions = user && profile ? (
    <EditProfileDialog userProfile={profile}>
      <Button variant="ghost" size="icon">
        <Edit className="h-5 w-5" />
      </Button>
    </EditProfileDialog>
  ) : null;

  return (
    <PageWrapper title="Player's Pavilion" actions={actions}>
        <Suspense fallback={<ProfileSkeleton />}>
          {renderPrivateContent()}
        </Suspense>

        <section className="space-y-3 pt-4">
            {user && (
                 <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/certificates">
                        <div className="flex items-center">
                            <Award className="mr-4" /> View Certificates
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
            )}
            <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                <Link href="/settings">
                    <div className="flex items-center">
                        <Settings className="mr-4" /> App Settings
                    </div>
                    <ChevronRight/>
                </Link>
            </Button>
            <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                <Link href="/policies">
                    <div className="flex items-center">
                        <Scale className="mr-4" /> Legal & Policies
                    </div>
                    <ChevronRight/>
                </Link>
            </Button>
        </section>
        
        {user && <CommentaryButton />}

        <SupportCard />

        {user && (
            <section className="pt-4">
                <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
            </section>
        )}
    </PageWrapper>
  );
}

const MemoizedProfilePageContent = memo(ProfilePageContent);

export default function ProfilePage() {
    return <MemoizedProfilePageContent />;
}
