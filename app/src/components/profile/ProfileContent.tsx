'use client';
import React, { memo } from 'react';
import ProfileHeader from './ProfileHeader';
import ProfileCompletion from './ProfileCompletion';
import ProfileStats from './ProfileStats';
import ReferralCard from './ReferralCard';
import DailyStreakCard from './DailyStreakCard';

function ProfileContentComponent({ userProfile }: { userProfile: any }) {

  return (
    <div className="space-y-6">
      <ProfileHeader userProfile={userProfile} />
      <ProfileCompletion userProfile={userProfile} />
      <ProfileStats userProfile={userProfile} />
      <DailyStreakCard userProfile={userProfile} />
      <ReferralCard referralCode={userProfile.referralCode} referralEarnings={userProfile.referralEarnings} />
    </div>
  );
}

const ProfileContent = memo(ProfileContentComponent);
export default ProfileContent;
