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
  ProfileStats: 88,
  ReferralCard: 220,
};

// Helper function for dynamic imports with automatic Skeleton heights
const loadWithSkeleton = (importFunc: () => Promise<{ default: React.ComponentType<any> }>, name: string) =>
  dynamic(importFunc, {
    loading: () => {
      const height = defaultSkeletonHeights[name] || 100; // fallback height
      return <Skeleton style={{ height: `${height}px` }} className="w-full" />;
    },
    ssr: false,
  });

// Generate dynamic components declaratively from the array
const cardsWithComponents = [
    { name: 'ProfileHeader', Component: loadWithSkeleton(() => import('@/components/profile/ProfileHeader'), 'ProfileHeader') },
    { name: 'ProfileCompletion', Component: loadWithSkeleton(() => import('@/components/profile/ProfileCompletion'), 'ProfileCompletion') },
    { name: 'DailyStreakCard', Component: loadWithSkeleton(() => import('@/components/profile/DailyStreakCard'), 'DailyStreakCard') },
    { name: 'ProfileStats', Component: loadWithSkeleton(() => import('@/components/profile/ProfileStats'), 'ProfileStats') },
    { name: 'ReferralCard', Component: loadWithSkeleton(() => import('@/components/profile/ReferralCard'), 'ReferralCard') },
];


export default function ProfilePageContent() {
    const { profile, logout, loading } = useAuth();
    const router = useRouter();

    if (loading || !profile) {
        return <ProfileSkeleton />;
    }

    const handleLogout = async () => {
      await logout();
      router.replace('/auth/login');
    };

    const ProfileHeader = cardsWithComponents.find(c => c.name === 'ProfileHeader')?.Component;
    const ProfileCompletion = cardsWithComponents.find(c => c.name === 'ProfileCompletion')?.Component;
    const DailyStreakCard = cardsWithComponents.find(c => c.name === 'DailyStreakCard')?.Component;
    const ProfileStats = cardsWithComponents.find(c => c.name === 'ProfileStats')?.Component;
    const ReferralCard = cardsWithComponents.find(c => c.name === 'ReferralCard')?.Component;


  return (
    <div className="space-y-4">
      {ProfileHeader && <ProfileHeader userProfile={profile} />}
      {ProfileCompletion && <ProfileCompletion />}
      {DailyStreakCard && <DailyStreakCard userProfile={profile} />}
      {ProfileStats && <ProfileStats />}
      {ReferralCard && <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />}

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
