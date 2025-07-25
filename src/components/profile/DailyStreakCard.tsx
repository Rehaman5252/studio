
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Star } from 'lucide-react';

const streakMilestones = {
  3: { tagline: "Opening Partnership: You’re off the mark!", reward: 0 },
  6: { tagline: "Powerplay Blitz: Starting strong!", reward: 0 },
  10: { tagline: "Captain’s Knock: You’re leading the innings!", reward: 0 },
  30: { tagline: "Half-Century Hero: You’ve hit ₹1,00,000 form!", reward: 100000 },
  45: { tagline: "Middle Overs Maestro: Rock-solid gameplay!", reward: 150000 },
  60: { tagline: "The Wall Mode: Unstoppable!", reward: 200000 },
  90: { tagline: "Nervous 90s: Consistency at its peak!", reward: 300000 },
  180: { tagline: "Double Century Club: Legendary streak!", reward: 500000 },
  360: { tagline: "Triple Ton: GOAT of indcric!", reward: 1000000 },
};

type StreakDay = keyof typeof streakMilestones;

export default function DailyStreakCard({ userProfile }: { userProfile: any }) {
  const currentStreak = userProfile?.currentStreak || 0;
  
  let currentMilestone: { tagline: string; reward: number; } | null = null;
  let nextMilestone: { day: StreakDay; reward: number; } | null = null;

  const milestoneDays = Object.keys(streakMilestones).map(Number).sort((a,b) => a-b) as StreakDay[];

  // Find the current milestone based on streak
  for (let i = milestoneDays.length - 1; i >= 0; i--) {
      const day = milestoneDays[i];
      if (currentStreak >= day) {
          currentMilestone = streakMilestones[day];
          break;
      }
  }

  // Find the next upcoming milestone
  for (const day of milestoneDays) {
    if (day > currentStreak) {
        nextMilestone = { day, reward: streakMilestones[day].reward };
        break;
    }
  }

  const tagline = currentMilestone?.tagline || "Play 15 quizzes a day to build your streak!";
  const daysToNextMilestone = nextMilestone ? nextMilestone.day - currentStreak : 0;

  return (
    <div className="w-full">
        <Card className="bg-gradient-to-tr from-card to-background shadow-lg border-primary/20 w-full">
            <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="text-primary h-5 w-5" /> Daily Streaks
                </CardTitle>
                <CardDescription className="text-xs">{tagline}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-4xl font-extrabold text-foreground">{currentStreak}</p>
                        <p className="text-sm font-semibold text-muted-foreground -mt-1">Day Streak</p>
                    </div>
                    {nextMilestone && nextMilestone.reward > 0 && (
                        <div className="text-right">
                        <p className="font-bold text-sm text-primary flex items-center justify-end gap-1"><Star className="h-4 w-4" /> Next Reward</p>
                        <p className="font-semibold text-foreground text-lg">Up to ₹{nextMilestone.reward.toLocaleString()}</p>
                        </div>
                    )}
                </div>
                
                {daysToNextMilestone > 0 && (
                    <div className="mt-2 text-center text-xs text-muted-foreground">
                        Keep going! {daysToNextMilestone} day{daysToNextMilestone > 1 ? 's' : ''} to your next milestone.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
};
