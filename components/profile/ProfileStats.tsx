
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Star, TrendingUp, Trophy } from 'lucide-react';
import React, { memo } from 'react';

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Card className="bg-secondary/50 p-3 rounded-lg transform transition-transform hover:scale-105 shadow-md">
    <div className='flex flex-col items-center text-center'>
      <div className="text-primary mb-1">{icon}</div>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase leading-tight mt-1">{label}</p>
    </div>
  </Card>
);

const ProfileStatsComponent = ({ userProfile }: { userProfile: any }) => {
  return (
    <div className="grid grid-cols-2 gap-3">
        <StatItem icon={<Star size={24} className="text-primary"/>} label="Perfect Scores" value={userProfile?.perfectScores || 0} />
        <StatItem icon={<Award size={24} className="text-primary"/>} label="Quizzes Played" value={userProfile?.quizzesPlayed || 0} />
        <StatItem icon={<TrendingUp size={24} className="text-primary"/>} label="Win Percentage" value={`${userProfile?.quizzesPlayed > 0 ? ((userProfile.perfectScores / userProfile.quizzesPlayed) * 100).toFixed(1) : 0}%`} />
        <StatItem icon={<Trophy size={24} className="text-primary"/>} label="Rewards Earned" value={`₹${userProfile?.totalRewards || 0}`} />
    </div>
  );
};

const ProfileStats = memo(ProfileStatsComponent);
export default ProfileStats;
