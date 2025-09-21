
'use client';
import React from 'react';
import dynamic, { DynamicOptions, DynamicModule } from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SupportCard from './SupportCard';
import { CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Define the shape for skeleton props
interface SkeletonProps {
  height?: number;
  className?: string;
}

// Default Skeleton heights per component name as a fallback
const defaultSkeletonHeights: Record<string, number> = {
  ProfileHeader: 112,
  ProfileCompletion: 96,
  DailyStreakCard: 110,
  ProfileStats: 88,
  ReferralCard: 220,
};

/**
 * A safe and adaptive dynamic import helper.
 * @param importFunc - The dynamic import() function.
 * @param name - The component's name, used for fallback height lookup.
 * @param skeletonProps - Optional custom styling for the skeleton.
 * @returns A dynamically loaded component with a styled Skeleton and error handling.
 */
const loadWithSkeleton = (
  importFunc: () => Promise<DynamicModule<{_?: any}>>,
  name: string,
  skeletonProps?: SkeletonProps
) => {
  return dynamic(importFunc, {
    loading: () => {
      const height = skeletonProps?.height ?? defaultSkeletonHeights[name] ?? 100;
      return <Skeleton className={cn(`h-[${height}px] w-full`, skeletonProps?.className)} />;
    },
    ssr: false, // Disable server-side rendering for these client components
  });
};


const ProfileHeader = loadWithSkeleton(() => import('@/components/profile/ProfileHeader'), 'ProfileHeader');
const ProfileCompletion = loadWithSkeleton(() => import('@/components/profile/ProfileCompletion'), 'ProfileCompletion');
const DailyStreakCard = loadWithSkeleton(() => import('@/components/profile/DailyStreakCard'), 'DailyStreakCard');
const ProfileStats = loadWithSkeleton(() => import('@/components/profile/ProfileStats'), 'ProfileStats');
const ReferralCard = loadWithSkeleton(() => import('@/components/profile/ReferralCard'), 'ReferralCard');


export default function ProfilePageContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  if (!profile) {
    // This case is handled by the parent page's auth guard, but it's good practice.
    return null; 
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
