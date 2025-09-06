
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Gift } from 'lucide-react';

const REWARD_GOALS = {
    facts: 25,
    posts: 25,
    questions: 50,
};

const StatItem = ({ label, count, goal }: { label: string, count: number, goal: number }) => {
    const percentage = Math.min(100, (count / goal) * 100);
    return (
        <div className="space-y-1">
            <div className="flex justify-between items-baseline">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{count} / {goal}</p>
            </div>
            <Progress value={percentage} className="h-2" />
        </div>
    );
};

export default function ContributionStats() {
    const { profile, loading } = useAuth();

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="space-y-2 pt-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </div>
            </div>
        );
    }
    
    if (!profile) return null;

    const factsSubmitted = profile.factsSubmitted || 0;
    const postsSubmitted = profile.postsSubmitted || 0;
    const questionsSubmitted = profile.questionsSubmitted || 0;

    const isGoalReached = factsSubmitted >= REWARD_GOALS.facts &&
                          postsSubmitted >= REWARD_GOALS.posts &&
                          questionsSubmitted >= REWARD_GOALS.questions;

    return (
        <Card className="bg-secondary/50">
            <CardHeader>
                <CardTitle className="text-base">Your Contribution Progress</CardTitle>
                <CardDescription>Submit content to earn a special Gift Voucher!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <StatItem label="Facts Submitted" count={factsSubmitted} goal={REWARD_GOALS.facts} />
                <StatItem label="Posts Submitted" count={postsSubmitted} goal={REWARD_GOALS.posts} />
                <StatItem label="Questions Submitted" count={questionsSubmitted} goal={REWARD_GOALS.questions} />

                {isGoalReached && (
                    <div className="pt-2 text-center text-primary font-semibold flex items-center justify-center gap-2 animate-pulse">
                        <Gift className="h-5 w-5" />
                        Congratulations! You've unlocked the Gift Voucher reward!
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
