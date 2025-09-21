'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Award, Edit, LogOut, Settings, Scale, ChevronRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import SupportCard from './SupportCard';
import LoginPrompt from '@/components/auth/LoginPrompt';
import ProfileSkeleton from './ProfileSkeleton';

interface SkeletonProps {
  height?: number;
  className?: string;
}

/**
 * A safe, dynamic import helper that shows an adaptive Skeleton during load.
 * @param importFunc - The dynamic import() function.
 * @param skeletonProps - Optional props for the Skeleton fallback.
 * @returns A dynamically loaded component with a loading fallback.
 */
const loadWithSkeleton = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  skeletonProps: SkeletonProps = {}
) =>
  dynamic(importFunc, {
    loading: () => {
      const { height = 100, className } = skeletonProps;
      return <Skeleton style={{ height: `${height}px` }} className={cn("w-full", className)} />;
    },
    ssr: false, // Ensure this only runs on the client
  });


const ProfileHeader = loadWithSkeleton(() => import('@/components/profile/ProfileHeader'), { height: 112 });
const ProfileCompletion = loadWithSkeleton(() => import('@/components/profile/ProfileCompletion'), { height: 96 });
const DailyStreakCard = loadWithSkeleton(() => import('@/components/profile/DailyStreakCard'), { height: 110 });
const ProfileStats = loadWithSkeleton(() => import('@/components/profile/ProfileStats'), { height: 88 });
const ReferralCard = loadWithSkeleton(() => import('@/components/profile/ReferralCard'), { height: 220 });

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


export default function ProfilePageContent() {
    const { profile, logout, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return <ProfileSkeleton />;
    }
    
    if (!profile) {
        return <LoggedOutProfileView />;
    }

    const handleLogout = async () => {
      await logout();
      router.replace('/auth/login');
    };

  return (
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
    </div>
  );
}
