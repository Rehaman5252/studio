'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Star, TrendingUp, Trophy } from 'lucide-react';
import React, { memo } from 'react';

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="bg-secondary/50 p-2 rounded-lg flex items-center gap-2 transform transition-transform hover:scale-105">
    <div className="text-primary">{icon}</div>
    <div className='flex-1 text-left'>
      <p className="text-base font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase leading-tight">{label}</p>
    </div>
  </div>
);

const ProfileStatsComponent = ({ userProfile }: { userProfile: any }) => {
  return (
    <Card className="bg-card shadow-lg">
        <CardContent className="grid grid-cols-2 gap-2 p-2">
            <StatItem icon={<Star size={20}/>} label="Perfect Scores" value={userProfile?.perfectScores || 0} />
            <StatItem icon={<Award size={20}/>} label="Quizzes Played" value={userProfile?.quizzesPlayed || 0} />
            <StatItem icon={<TrendingUp size={20}/>} label="Win Percentage" value={`${userProfile?.quizzesPlayed > 0 ? ((userProfile.perfectScores / userProfile.quizzesPlayed) * 100).toFixed(1) : 0}%`} />
            <StatItem icon={<Trophy size={20}/>} label="Rewards Earned" value={`₹${userProfile?.totalRewards || 0}`} />
        </CardContent>
    </Card>
  );
};

const ProfileStats = memo(ProfileStatsComponent);
export default ProfileStats;
