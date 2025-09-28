
'use client';
import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import SupportCard from './SupportCard';
import { Skeleton } from '@/components/ui/skeleton';
import LoginPrompt from '@/components/auth/LoginPrompt';

const ProfileHeader = dynamic(() => import('@/components/profile/ProfileHeader'), { loading: () => <Skeleton className="h-28 w-full" />});
const ProfileCompletion = dynamic(() => import('@/components/profile/ProfileCompletion'), { loading: () => <Skeleton className="h-24 w-full" />});
const ProfileStats = dynamic(() => import('@/components/profile/ProfileStats'), { loading: () => <Skeleton className="h-32 w-full" />});
const ReferralCard = dynamic(() => import('@/components/profile/ReferralCard'), { loading: () => <Skeleton className="h-48 w-full" />});
const DailyStreakCard = dynamic(() => import('@/components/profile/DailyStreakCard'), { loading: () => <Skeleton className="h-24 w-full" />});


function ProfilePageContent() {
  const { profile, logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };
  
  return (
    <div className="space-y-4">
      {user && profile ? (
        <>
          <ProfileHeader userProfile={profile} />
          <ProfileCompletion />
          <DailyStreakCard userProfile={profile} />
          <ProfileStats />
          <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />
        </>
      ) : (
        <LoginPrompt 
          icon={User}
          title="Ready to Step Up to the Crease?"
          description="Sign in to view your profile, track stats, and climb the leaderboard."
        />
      )}

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

      {user && (
        <section className="pt-4">
            <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
        </section>
      )}
    </div>
  );
}

export default memo(ProfilePageContent);
