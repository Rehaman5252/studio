
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Flame, Star } from 'lucide-react';

const streakMilestones: { [key: number]: { tagline: string; reward: string } } = {
  3: { tagline: "Opening Partnership: You’re off the mark!", reward: "Bonus Hints" },
  6: { tagline: "Powerplay Blitz: Starting strong!", reward: "Exclusive Avatar Frame" },
  10: { tagline: "Captain’s Knock: You’re leading the innings!", reward: "Special Badge" },
  30: { tagline: "Half-Century Hero: You’ve hit form!", reward: "Up to ₹1,00,000" },
  45: { tagline: "Middle Overs Maestro: Rock-solid gameplay!", reward: "Up to ₹1,50,000" },
  60: { tagline: "The Wall Mode: Unstoppable!", reward: "Up to ₹2,00,000" },
  90: { tagline: "Nervous 90s: Consistency at its peak!", reward: "Up to ₹3,00,000" },
  180: { tagline: "Double Century Club: Legendary streak!", reward: "Up to ₹5,00,000" },
  360: { tagline: "Triple Ton: GOAT of CricBlitz!", reward: "Up to ₹10,00,000" },
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
        <Card className="bg-gradient-to-tr from-accent/10 to-primary/10 shadow-lg w-full">
            <CardHeader className="py-3 px-4">
                <CardTitle className="flex items-center gap-2 text-base">
                    <Flame className="text-primary h-5 w-5" /> Daily Streak
                </CardTitle>
                <CardDescription className="text-xs">{tagline}</CardDescription>
            </CardHeader>
            <CardContent className="px-4 pb-3">
                <div className="flex items-center justify-start text-left">
                    <div>
                        <p className="text-4xl font-extrabold text-foreground">{currentStreak}</p>
                        <p className="text-sm font-semibold text-muted-foreground -mt-1">Day Streak</p>
                    </div>
                </div>
                
                {nextMilestone && (
                    <div className="mt-2 text-center text-xs text-muted-foreground">
                        Keep going! {daysToNextMilestone} day{daysToNextMilestone > 1 ? 's' : ''} to your next reward: <span className="font-bold text-foreground/80">{nextMilestone.reward}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
};
