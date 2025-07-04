'use client';

import React, { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trophy, Home } from 'lucide-react';

function ResultsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const score = searchParams.get('score') || '0';
    const total = searchParams.get('total') || '5';
    const brand = searchParams.get('brand') || 'CricBlitz';
    const format = searchParams.get('format') || 'Cricket';

    const scoreNum = parseInt(score, 10);
    const totalNum = parseInt(total, 10);

    let message = "Good effort! Keep practicing.";
    if (scoreNum === totalNum) {
        message = "Perfect score! You're a true cricket expert!";
    } else if (scoreNum >= totalNum * 0.7) {
        message = "Great job! You really know your cricket.";
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
            <Card className="w-full max-w-md text-center bg-white/10 border-0">
                <CardHeader>
                    <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-4">
                        <Trophy className="h-12 w-12 text-yellow-300" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold">Quiz Complete!</CardTitle>
                    <CardDescription className="text-base text-white/80">{format} Quiz - Sponsored by {brand}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <p className="text-lg">You Scored</p>
                        <p className="text-6xl font-bold my-2">
                            {score} <span className="text-3xl text-white/70">/ {total}</span>
                        </p>
                    </div>
                    <p className="text-lg font-medium text-yellow-300">{message}</p>
                    <Button
                        size="lg"
                        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg"
                        onClick={() => router.replace('/home')}
                    >
                        <Home className="mr-2 h-5 w-5" />
                        Back to Home
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>Loading results...</p>
            </div>
        }>
            <ResultsComponent />
        </Suspense>
    )
}
