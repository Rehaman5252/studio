'use client';

import React, { memo } from 'react';
import dynamic, { DynamicOptions, DynamicModule } from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// Define the shape for skeleton props
interface SkeletonProps {
  height?: number;
  className?: string;
}

// Define the shape of our card configuration
interface CardConfig {
  title: string;
  name: string;
  importPath: string;
  skeletonProps?: SkeletonProps;
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

// --- Declarative Card Configuration ---
const profileCards: CardConfig[] = [
  { title: 'Profile', name: 'ProfileHeader', importPath: '@/components/profile/ProfileHeader', skeletonProps: { height: 112 } },
  { title: 'Completion', name: 'ProfileCompletion', importPath: '@/components/profile/ProfileCompletion', skeletonProps: { height: 96 } },
  { title: 'Daily Streak', name: 'DailyStreakCard', importPath: '@/components/profile/DailyStreakCard', skeletonProps: { height: 110 } },
  { title: 'Statistics', name: 'ProfileStats', importPath: '@/components/profile/ProfileStats', skeletonProps: { height: 88 } },
  { title: 'Referral Program', name: 'ReferralCard', importPath: '@/components/profile/ReferralCard', skeletonProps: { height: 220 } },
];

// --- Generate Dynamic Components ---
const cardsWithComponents = profileCards.map(({ title, name, importPath, skeletonProps }) => ({
  title,
  Component: loadWithSkeleton(
    () => import(`${importPath}`).catch(err => {
      console.error(`Failed to load component "${name}" from ${importPath}:`, err);
      // Return a fallback component that just renders the skeleton on error
      return { default: () => {
          const height = skeletonProps?.height ?? defaultSkeletonHeights[name] ?? 100;
          return <Skeleton className={cn(`h-[${height}px] w-full`, skeletonProps?.className)} />;
      }};
    }),
    name,
    skeletonProps
  ),
}));

// --- Main Component ---
function ProfilePageContentComponent() {
  const { profile, logout } = useAuth(); // Assuming useAuth provides profile and logout
  const router = useRouter();

  if (!profile) {
    // This case is handled by the parent, but it's good practice.
    return null; 
  }
  
  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  return (
    <div className="space-y-4">
      {/* Map through the generated components */}
      {cardsWithComponents.map(({ title, Component }) => (
        <Card key={title}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <Component userProfile={profile} referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />
            </CardContent>
        </Card>
      ))}

      {/* Static cards and buttons can remain here */}
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

// We need to import these here for the component to function
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SupportCard from './SupportCard';
import { CardDescription } from '@/components/ui/card';

export default memo(ProfilePageContentComponent);
