
'use client';
import { Card, CardContent } from '@/components/ui/card';
import { Award, Star, TrendingUp, Trophy } from 'lucide-react';
import React, { memo } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

const StatItem = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) => (
  <Card className="bg-secondary/50 p-3 rounded-lg shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-primary/40">
    <div className='flex flex-col items-center text-center'>
      <div className="text-primary mb-1">{icon}</div>
      <p className="text-xl font-bold text-foreground leading-tight">{value}</p>
      <p className="text-[10px] text-muted-foreground font-semibold uppercase leading-tight mt-1">{label}</p>
    </div>
  </Card>
);

const StatsSkeleton = () => (
    <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-[90px] w-full" />
        <Skeleton className="h-[90px] w-full" />
        <Skeleton className="h-[90px] w-full" />
        <Skeleton className="h-[90px] w-full" />
    </div>
);

const ProfileStatsComponent = () => {
  const { profile, loading } = useAuth();
  
  if (loading || !profile) {
    return <StatsSkeleton />;
  }

  const quizzesPlayed = profile?.quizzesPlayed || 0;
  const perfectScores = profile?.perfectScores || 0;
  const winPercentage = quizzesPlayed > 0 ? ((perfectScores / quizzesPlayed) * 100).toFixed(1) : 0;
  const totalRewards = profile?.totalRewards || 0;

  return (
    <div className="grid grid-cols-2 gap-3">
        <StatItem icon={<Star size={24} className="text-primary"/>} label="Perfect Scores" value={perfectScores} />
        <StatItem icon={<Award size={24} className="text-primary"/>} label="Quizzes Played" value={quizzesPlayed} />
        <StatItem icon={<TrendingUp size={24} className="text-primary"/>} label="Win Percentage" value={`${winPercentage}%`} />
        <StatItem icon={<Trophy size={24} className="text-primary"/>} label="Rewards Earned" value={`₹${totalRewards}`} />
    </div>
  );
};

const ProfileStats = memo(ProfileStatsComponent);
export default ProfileStats;
