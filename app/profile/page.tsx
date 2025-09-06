"use client";
import React, { Suspense, memo } from "react";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { UserCheck, ServerCrash, WifiOff, Settings, Scale, LogOut, ChevronRight, Award, Edit } from 'lucide-react';
import { useAuth } from "@/context/AuthProvider";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/PageWrapper";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/auth/AuthGuard";

const ProfileContent = dynamic(() => import('@/components/profile/ProfileContent'), {
  loading: () => <ProfileSkeleton />,
  ssr: false,
});
const SupportCard = dynamic(() => import('@/components/profile/SupportCard'), {
    loading: () => <Skeleton className="h-28 w-full" />,
});

function ProfilePageContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };
  
  return (
    <PageWrapper title="Player's Pavilion">
        <AuthGuard>
            <Suspense fallback={<ProfileSkeleton />}>
              {profile ? <ProfileContent profile={profile} /> : <ProfileSkeleton />}
            </Suspense>

            <section className="space-y-3 pt-4">
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/certificates">
                        <div className="flex items-center">
                            <Award className="mr-4 text-primary" /> View Certificates
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
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
            
            <Card className="bg-card shadow-lg mt-4">
                <CardHeader>
                    <CardTitle className="text-lg">Commentary Box</CardTitle>
                    <CardDescription>
                        Share your cricket knowledge with the community and earn rewards.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                        <Link href="/contribute">
                            <div className="flex items-center">
                                <Edit className="mr-4 text-primary" />
                                Contribute Now
                            </div>
                            <ChevronRight/>
                        </Link>
                    </Button>
                </CardContent>
            </Card>

            <SupportCard />

            <section className="pt-4">
                <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
            </section>
        </AuthGuard>
    </PageWrapper>
  );
}

const ProfilePage = memo(ProfilePageContent);

export default ProfilePage;
