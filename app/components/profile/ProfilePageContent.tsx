
'use client';
import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight, User } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import SupportCard from './SupportCard';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileCompletion from '@/components/profile/ProfileCompletion';
import ProfileStats from '@/components/profile/ProfileStats';
import ReferralCard from '@/components/profile/ReferralCard';
import DailyStreakCard from '@/components/profile/DailyStreakCard';

function ProfilePageContent() {
  const { profile, logout, user } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (!profile || !user) {
    return null; // The parent page handles the LoginPrompt
  }
  
  return (
    <div className="space-y-4">
        <ProfileHeader userProfile={profile} />
        <ProfileCompletion />
        <DailyStreakCard userProfile={profile} />
        <ProfileStats />
        <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings || 0} />

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
