
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Star } from 'lucide-react';

const streakMilestones = {
  3: { tagline: "Getting your eye in!", reward: "Bonus Hints" },
  7: { tagline: "On a Roll!", reward: "Exclusive Avatar Frame" },
  14: { tagline: "Two Weeks Strong!", reward: "250 Coins" },
  30: { tagline: "One Month Mastery!", reward: "1,000 Coins" },
  60: { tagline: "Two Month Legend!", reward: "Golden Avatar Frame" },
  90: { tagline: "Three Month GOAT!", reward: "5,000 Coins" },
  180: { tagline: "Half-Year Hero!", reward: "10,000 Coins" },
  365: { tagline: "Year-Long Champion!", reward: "Hall of Fame Entry" },
};

type StreakDay = keyof typeof streakMilestones;

export default function DailyStreakCard({ userProfile }: { userProfile: any }) {
  const currentStreak = userProfile?.currentStreak || 0;
  
  let currentMilestone: { tagline: string; reward: string; } | null = null;
  let nextMilestone: { day: StreakDay; reward: string; } | null = null;

  const milestoneDays = Object.keys(streakMilestones).map(Number).sort((a,b) => a-b) as StreakDay[];

  for (let i = milestoneDays.length - 1; i >= 0; i--) {
      const day = milestoneDays[i];
      if (currentStreak >= day) {
          currentMilestone = streakMilestones[day];
          break;
      }
  }

  for (const day of milestoneDays) {
    if (day > currentStreak) {
        nextMilestone = { day, reward: streakMilestones[day].reward };
        break;
    }
  }

  const tagline = currentMilestone?.tagline || "Play daily to build your streak!";
  const daysToNextMilestone = nextMilestone ? nextMilestone.day - currentStreak : 0;

  return (
    <div className="w-full">
        <Card className="bg-gradient-to-tr from-accent/10 to-primary/10 shadow-lg border-primary/20 w-full">
            <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="text-primary h-5 w-5" /> Daily Streak
                </CardTitle>
                <CardDescription className="text-xs">{tagline}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3">
                <div className="flex items-center justify-center text-center">
                    <div>
                        <p className="text-4xl font-extrabold text-foreground">{currentStreak}</p>
                        <p className="text-sm font-semibold text-muted-foreground -mt-1">Day Streak</p>
                    </div>
                </div>
                
                {daysToNextMilestone > 0 && (
                    <div className="mt-2 text-center text-xs text-muted-foreground">
                        Keep going! {daysToNextMilestone} day{daysToNextMilestone > 1 ? 's' : ''} to your next reward.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
};
