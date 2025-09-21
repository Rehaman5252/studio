'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Award, Edit, LogOut, Settings, Scale, ChevronRight, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import SupportCard from './SupportCard';
import LoginPrompt from '@/components/auth/LoginPrompt';
import ProfileSkeleton from './ProfileSkeleton';
import ClientOnly from '@/components/ClientOnly';
import { Button } from '../ui/button';

// Default Skeleton heights per component name
const defaultSkeletonHeights: Record<string, number> = {
  ProfileHeader: 112,
  ProfileCompletion: 96,
  DailyStreakCard: 110,
  ProfileStats: 88,
  ReferralCard: 220,
};

// Helper function for dynamic imports with automatic Skeleton heights and error handling
const loadWithSkeleton = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  name: string
) =>
  dynamic(importFunc, {
    loading: () => {
      const height = defaultSkeletonHeights[name] || 100; // fallback height
      return <Skeleton style={{ height: `${height}px` }} className="w-full" />;
    },
    ssr: false, // prevent SSR import errors
  });

// Declarative array of cards
const profileCardsMeta = [
    { name: 'ProfileHeader', importPath: '@/components/profile/ProfileHeader', Component: null as any },
    { name: 'ProfileCompletion', importPath: '@/components/profile/ProfileCompletion', Component: null as any },
    { name: 'DailyStreakCard', importPath: '@/components/profile/DailyStreakCard', Component: null as any },
    { name: 'ProfileStats', importPath: '@/components/profile/ProfileStats', Component: null as any },
    { name: 'ReferralCard', importPath: '@/components/profile/ReferralCard', Component: null as any },
];

// Generate dynamic components declaratively
const cardsWithComponents = profileCardsMeta.map(card => ({
  ...card,
  Component: loadWithSkeleton(() => import(`${card.importPath}`), card.name),
}));


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
      {cardsWithComponents.map(({ name, Component }) => {
          if (name === 'ProfileHeader') return <Component key={name} userProfile={profile} />;
          if (name === 'DailyStreakCard') return <Component key={name} userProfile={profile} />;
          if (name === 'ReferralCard') return <Component key={name} referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />;
          return <Component key={name} />;
      })}

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
