
'use client';
import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

const ProfileHeader = dynamic(() => import('@/components/profile/ProfileHeader'));
const ProfileCompletion = dynamic(() => import('@/components/profile/ProfileCompletion'));
const ProfileStats = dynamic(() => import('@/components/profile/ProfileStats'));
const ReferralCard = dynamic(() => import('@/components/profile/ReferralCard'));
const DailyStreakCard = dynamic(() => import('@/components/profile/DailyStreakCard'));
const SupportCard = dynamic(() => import('@/components/profile/SupportCard'));


function ProfilePageContent() {
  const { profile, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };
  
  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Could not load profile data.
        </AlertDescription>
      </Alert>
    );
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

export default memo(ProfilePageContent);
