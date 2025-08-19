
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Users, Users2, Trophy } from 'lucide-react';
import TimerStat from '@/components/stats/TimerStat';
import PlayersPlayingStat from '@/components/stats/PlayersPlayingStat';
import PlayersPlayedStat from '@/components/stats/PlayersPlayedStat';
import TotalWinnersStat from '@/components/stats/TotalWinnersStat';
import { useQuizStatus } from '@/context/QuizStatusProvider';

const StatCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <Card className="bg-card/80 shadow-md border-primary/10 hover:border-primary/30 transition-all">
    <CardContent className="p-3 text-center flex flex-col items-center justify-center h-full">
      <div className="text-primary">{icon}</div>
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">{title}</p>
      <div className="mt-1 text-foreground">{children}</div>
    </CardContent>
  </Card>
);

const GlobalStatsComponent = () => {
    const { timeLeft, playersPlaying, playersPlayed, totalWinners } = useQuizStatus();
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon={<Timer />} title="Quiz Ends">
                <TimerStat timeLeft={timeLeft} />
            </StatCard>
            <StatCard icon={<Users />} title="Players Playing">
                <PlayersPlayingStat count={playersPlaying} />
            </StatCard>
            <StatCard icon={<Users2 />} title="Players Played">
                <PlayersPlayedStat count={playersPlayed} />
            </StatCard>
            <StatCard icon={<Trophy />} title="Total Winners">
                <TotalWinnersStat count={totalWinners} />
            </StatCard>
        </div>
    )
}

export default memo(GlobalStatsComponent);
