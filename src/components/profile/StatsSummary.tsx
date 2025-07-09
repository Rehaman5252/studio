'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy, Star, Banknote } from 'lucide-react';

const StatItem = memo(({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => {
    return (
        <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
            <Icon className="h-7 w-7 text-primary" />
            <p className="font-bold text-xl">{value}</p>
            <p className="text-xs text-muted-foreground">{title}</p>
        </div>
    );
});
StatItem.displayName = 'StatItem';

function StatsSummary({ userProfile }: { userProfile: any }) {
    return (
        <Card className="bg-card shadow-lg">
            <CardContent className="p-4 grid grid-cols-3 gap-4">
                <StatItem title="Quizzes Played" value={userProfile?.quizzesPlayed || 0} icon={Trophy} />
                <StatItem title="Perfect Scores" value={userProfile?.perfectScores || 0} icon={Star} />
                <StatItem title="Total Earnings" value={`₹${userProfile?.totalRewards || 0}`} icon={Banknote} />
            </CardContent>
        </Card>
    );
};

export default memo(StatsSummary);
