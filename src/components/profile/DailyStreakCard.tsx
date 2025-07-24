
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Star } from 'lucide-react';

const streakMilestones = {
  360: { tagline: "Triple Ton: GOAT of indcric!", reward: 1000000 },
  180: { tagline: "Double Century Club: Legendary streak!", reward: 500000 },
  90: { tagline: "Nervous 90s: Consistency at its peak!", reward: 300000 },
  60: { tagline: "The Wall Mode: Unstoppable!", reward: 200000 },
  45: { tagline: "Middle Overs Maestro: Rock-solid gameplay!", reward: 150000 },
  30: { tagline: "Half-Century Hero: You’ve hit ₹1,00,000 form!", reward: 100000 },
  10: { tagline: "Captain’s Knock: You’re leading the innings!", reward: 0 },
  6: { tagline: "Powerplay Blitz: Starting strong!", reward: 0 },
  3: { tagline: "Opening Partnership: You’re off the mark!", reward: 0 },
};

type StreakDay = keyof typeof streakMilestones;

const DailyStreakCard = ({ userProfile }: { userProfile: any }) => {
  const currentStreak = userProfile?.currentStreak || 0;
  
  let milestone: { tagline: string; reward: number; } | null = null;
  let nextMilestoneDay: StreakDay | null = null;

  const milestoneDays = Object.keys(streakMilestones).map(Number).sort((a,b) => a-b) as StreakDay[];

  for (let i = milestoneDays.length - 1; i >= 0; i--) {
      const day = milestoneDays[i];
      if (currentStreak >= day) {
          milestone = streakMilestones[day];
          const nextIndex = i + 1;
          if (nextIndex < milestoneDays.length) {
              nextMilestoneDay = milestoneDays[nextIndex];
          }
          break;
      }
  }

  if (currentStreak > 0 && !milestone) {
    const upcomingMilestones = milestoneDays.filter(day => day > currentStreak);
    if (upcomingMilestones.length > 0) {
      nextMilestoneDay = upcomingMilestones[0];
    }
  } else if (currentStreak === 0) {
      nextMilestoneDay = milestoneDays[0];
  }

  return (
    <div>
      <Card className="bg-gradient-to-tr from-card to-background shadow-lg border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Flame className="text-primary" /> Daily Streaks
          </CardTitle>
          {milestone?.tagline ? (
              <CardDescription>{milestone.tagline}</CardDescription>
          ) : (
               <CardDescription>Play 15 quizzes a day to build your streak!</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-6xl font-extrabold text-foreground">{currentStreak}</p>
              <p className="text-lg font-semibold text-muted-foreground -mt-2">Day Streak</p>
            </div>
            {milestone?.reward > 0 && (
              <div className="text-right">
                <p className="font-bold text-lg text-primary flex items-center gap-1"><Star className="h-4 w-4" /> Current Reward</p>
                <p className="font-semibold text-foreground">Up to ₹{milestone.reward.toLocaleString()}</p>
              </div>
            )}
          </div>
          
          {nextMilestoneDay && (
               <div className="mt-4 text-center text-sm text-muted-foreground">
                   Keep going! {nextMilestoneDay - currentStreak} day{nextMilestoneDay - currentStreak > 1 ? 's' : ''} to your next milestone.
               </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default memo(DailyStreakCard);
