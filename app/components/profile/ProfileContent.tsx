
'use client';
import React, { memo } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileCompletion from '@/components/profile/ProfileCompletion';
import ProfileStats from '@/components/profile/ProfileStats';
import ReferralCard from '@/components/profile/ReferralCard';
import DailyStreakCard from '@/components/profile/DailyStreakCard';
import type { UserProfile } from '@/context/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { AlertTriangle } from 'lucide-react';

function ProfileContentComponent({ profile }: { profile: UserProfile | null }) {
  if (!profile) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Tried to render profile content without a valid profile. Please try refreshing.
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
    </div>
  );
}

const ProfileContent = memo(ProfileContentComponent);
export default ProfileContent;
