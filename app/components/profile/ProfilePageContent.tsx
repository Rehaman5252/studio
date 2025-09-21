
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ProfileSkeleton from './ProfileSkeleton';
import SupportCard from './SupportCard';

// Default Skeleton heights per component name
const defaultSkeletonHeights: Record<string, number> = {
  ProfileHeader: 112,
  ProfileCompletion: 96,
  DailyStreakCard: 110,
  ProfileStats: 190,
  ReferralCard: 220,
};

// Helper function for dynamic imports with automatic Skeleton heights
const loadWithSkeleton = (importFunc: () => Promise<{ default: React.ComponentType<any> }>, name: string) =>
  dynamic(importFunc, {
    loading: () => {
      const height = defaultSkeletonHeights[name] || 100; // fallback height
      return <Skeleton className={`h-[${height}px] w-full`} />;
    },
    ssr: false,
  });

// Dynamic components using the advanced helper
const ProfileHeader = loadWithSkeleton(() => import('@/components/profile/ProfileHeader'), 'ProfileHeader');
const ProfileCompletion = loadWithSkeleton(() => import('@/components/profile/ProfileCompletion'), 'ProfileCompletion');
const DailyStreakCard = loadWithSkeleton(() => import('@/components/profile/DailyStreakCard'), 'DailyStreakCard');
const ProfileStats = loadWithSkeleton(() => import('@/components/profile/ProfileStats'), 'ProfileStats');
const ReferralCard = loadWithSkeleton(() => import('@/components/profile/ReferralCard'), 'ReferralCard');


export default function ProfilePageContent() {
    const { profile, logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
      await logout();
      router.replace('/auth/login');
    };

    if (!profile) {
        return <ProfileSkeleton />;
    }

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
