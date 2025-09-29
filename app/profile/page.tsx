
'use client';

import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import ClientOnly from '@/components/ClientOnly';
import { User, Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import SupportCard from '@/components/profile/SupportCard';

const ProfileHeader = dynamic(() => import('@/components/profile/ProfileHeader'), { loading: () => <Skeleton className="h-28 w-full" />});
const ProfileCompletion = dynamic(() => import('@/components/profile/ProfileCompletion'), { loading: () => <Skeleton className="h-24 w-full" />});
const DailyStreakCard = dynamic(() => import('@/components/profile/DailyStreakCard'), { loading: () => <Skeleton className="h-24 w-full" />});
const ProfileStats = dynamic(() => import('@/components/profile/ProfileStats'), { loading: () => <Skeleton className="h-32 w-full" />});
const ReferralCard = dynamic(() => import('@/components/profile/ReferralCard'), { loading: () => <Skeleton className="h-48 w-full" />});

function ProfilePage() {
    const { profile, logout, loading, user } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/auth/login');
    };
  
    if (loading) {
        return (
             <PageWrapper title="Player's Pavilion">
                <ProfileSkeleton />
             </PageWrapper>
        );
    }

    if (!user) {
        return (
            <PageWrapper title="Player's Pavilion">
                 <div className="space-y-4">
                    <div className="text-center p-8 bg-card rounded-lg shadow-lg">
                        <User className="mx-auto h-12 w-12 text-primary mb-4" />
                        <h2 className="text-xl font-bold">Ready to Step Up?</h2>
                        <p className="text-muted-foreground mt-2 mb-4">Sign in to view your profile, track stats, and climb the leaderboard.</p>
                        <Button asChild>
                            <Link href="/auth/login?from=/profile">
                                Sign In / Sign Up
                            </Link>
                        </Button>
                    </div>
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
            </PageWrapper>
        );
    }

    if (!profile) {
        return (
            <PageWrapper title="Player's Pavilion">
                <Alert variant="destructive">
                    <AlertTitle>Profile Not Found</AlertTitle>
                    <AlertDescription>
                    Could not load profile data. Please try logging in again.
                    </AlertDescription>
                    <Button onClick={() => router.push('/auth/login')} className="mt-4">Login</Button>
                </Alert>
            </PageWrapper>
        );
    }
  
    return (
        <PageWrapper title="Player's Pavilion">
            <ClientOnly fallback={<ProfileSkeleton />}>
                <div className="space-y-4">
                    <ProfileHeader userProfile={profile} />
                    <ProfileCompletion />
                    <DailyStreakCard userProfile={profile} />
                    <ProfileStats />
                    <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />
                    
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
                          <Link href="/contribute">
                              <div className="flex items-center">
                                  <Edit className="mr-4 text-primary" /> Contribute
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
                    
                    <SupportCard />

                    <section className="pt-4">
                        <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                            <LogOut className="mr-2 h-5 w-5" /> Logout
                        </Button>
                    </section>
                </div>
            </ClientOnly>
        </PageWrapper>
    );
}

export default memo(ProfilePage);
