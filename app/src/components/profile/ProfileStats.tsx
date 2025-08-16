'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, Star, TrendingUp, Trophy } from 'lucide-react';
import React, { memo } from 'react';

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <div className="bg-secondary/50 p-3 rounded-lg text-center transform transition-transform hover:scale-105">
    <div className="text-primary mx-auto w-fit">{icon}</div>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    <p className="text-xs text-muted-foreground font-semibold uppercase">{label}</p>
  </div>
);

const ProfileStatsComponent = ({ userProfile }: { userProfile: any }) => {
  return (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Trophy /> Player Stats</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <StatItem icon={<Star />} label="Perfect Scores" value={userProfile?.perfectScores || 0} />
            <StatItem icon={<Award />} label="Quizzes Played" value={userProfile?.quizzesPlayed || 0} />
            <StatItem icon={<TrendingUp />} label="Win Percentage" value={`${userProfile?.quizzesPlayed > 0 ? ((userProfile.perfectScores / userProfile.quizzesPlayed) * 100).toFixed(1) : 0}%`} />
            <StatItem icon={<Trophy />} label="Rewards Earned" value={`₹${userProfile?.totalRewards || 0}`} />
        </CardContent>
    </Card>
  );
};

const ProfileStats = memo(ProfileStatsComponent);
export default ProfileStats;
