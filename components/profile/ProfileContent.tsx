
'use client';
import React, { memo } from 'react';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileCompletion from '@/components/profile/ProfileCompletion';
import ProfileStats from '@/components/profile/ProfileStats';
import ReferralCard from '@/components/profile/ReferralCard';
import DailyStreakCard from '@/components/profile/DailyStreakCard';

function ProfileContentComponent({ userProfile }: { userProfile: any }) {

  return (
    <div className="space-y-6">
      <ProfileHeader userProfile={userProfile} />
      <ProfileCompletion userProfile={userProfile} />
      <DailyStreakCard userProfile={userProfile} />
      <ProfileStats userProfile={userProfile} />
      <ReferralCard referralCode={userProfile.referralCode} referralEarnings={userProfile.referralEarnings} />
    </div>
  );
}

const ProfileContent = memo(ProfileContentComponent);
export default ProfileContent;
