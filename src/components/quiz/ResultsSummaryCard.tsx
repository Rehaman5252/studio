
'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface ResultsSummaryCardProps {
    isReview: boolean;
    format: string;
    brand: string;
    score: number;
    totalQuestions: number;
    isPerfectScore: boolean;
    message: string;
    onViewAnswers: () => void;
    isViewingAnswers: boolean;
}

const ResultsSummaryCardComponent = ({
    isReview, format, brand, score, totalQuestions, isPerfectScore, message, onViewAnswers, isViewingAnswers
}: ResultsSummaryCardProps) => (
    <div className="w-full max-w-md">
        <Card className="w-full text-center bg-card border-0 my-4">
            <CardHeader className={cn(isReview && "pt-2")}>
                <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                    <Trophy className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-extrabold">Quiz Complete!</CardTitle>
                <CardDescription className="text-base text-muted-foreground">{format} Quiz - Sponsored by {brand}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <p className="text-lg">You Scored</p>
                    <p className="text-6xl font-bold my-2 text-primary">
                        {score} <span className="text-3xl text-muted-foreground">/ {totalQuestions}</span>
                    </p>
                </div>
                <p className="text-lg font-medium text-primary">{message}</p>
                
                {isPerfectScore && (
                    <div className="bg-primary/20 p-4 rounded-lg border border-primary">
                        <h3 className="font-bold text-lg text-foreground">Congratulations!</h3>
                        <p className="text-sm text-foreground/90">You've won a special reward!</p>
                    </div>
                )}
                
                <div className="grid grid-cols-1 gap-3">
                    <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" asChild>
                        <Link href="/home" prefetch={true}>
                          <Home className="mr-2 h-5 w-5" /> Go Home
                        </Link>
                    </Button>
                </div>

                <Button variant="outline" className="w-full" onClick={onViewAnswers} disabled={isViewingAnswers}>
                   {isViewingAnswers ? "Answers Displayed Below" : "View Correct Answers (Ad)"}
                </Button>
            </CardContent>
        </Card>
    </div>
);

ResultsSummaryCardComponent.displayName = 'ResultsSummaryCard';

export const ResultsSummaryCard = memo(ResultsSummaryCardComponent);
