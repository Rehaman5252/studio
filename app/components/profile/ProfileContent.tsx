
'use client';
import React, { memo } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileCompletion from '@/components/profile/ProfileCompletion';
import ProfileStats from '@/components/profile/ProfileStats';
import ReferralCard from '@/components/profile/ReferralCard';
import DailyStreakCard from '@/components/profile/DailyStreakCard';
import { useAuth } from '@/context/AuthProvider';
import type { UserProfile } from '@/context/AuthProvider';

function ProfileContentComponent({ profile }: { profile: UserProfile }) {
  return (
    <div className="space-y-4">
      <ProfileHeader userProfile={profile} />
      <ProfileCompletion />
      <DailyStreakCard userProfile={profile} />
      <ProfileStats userProfile={profile} />
      <ReferralCard referralCode={profile.referralCode} referralEarnings={profile.referralEarnings} />
    </div>
  );
}

const ProfileContent = memo(ProfileContentComponent);
export default ProfileContent;
