
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Ban, Sparkles, Calendar, CheckCircle, Clock, Eye, ServerCrash, WifiOff, Check } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { useRouter } from 'next/navigation';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { AdDialog } from '../AdDialog';
import { adLibrary } from '@/lib/ads';
import AnalysisDialog from './AnalysisDialog';
import ReviewDialog from './ReviewDialog';

export const HistoryItemSkeleton = () => (
    <Card className="bg-card/80 border-primary/10 shadow-lg">
        <CardHeader>
            <div className="flex items-start gap-4">
                <div className="animate-pulse bg-muted rounded-md h-8 w-8 mt-1 flex-shrink-0" />
                <div className="flex-grow space-y-2">
                    <div className="animate-pulse bg-muted h-5 w-3/4 rounded-md" />
                    <div className="animate-pulse bg-muted h-4 w-1/2 rounded-md" />
                    <div className="animate-pulse bg-muted h-3 w-5/6 rounded-md" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex justify-end gap-2">
            <div className="animate-pulse bg-muted h-9 w-24 rounded-md" />
        </CardContent>
    </Card>
);

export const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const getSlotTimings = (timestamp: number) => {
    const attemptDate = new Date(timestamp);
    const minutes = attemptDate.getMinutes();
    const slotStartMinute = Math.floor(minutes / 10) * 10;
    
    const slotStartTime = new Date(attemptDate);
    slotStartTime.setMinutes(slotStartMinute, 0, 0);
    
    const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
  };

export const HistoryItem = ({ attempt }: { attempt: QuizAttempt }) => {
  const router = useRouter();
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [isReviewed, setIsReviewed] = useState(false);
  const reviewedStorageKey = 'indcric-reviewed-attempts';

  useEffect(() => {
    const reviewedItems = JSON.parse(localStorage.getItem(reviewedStorageKey) || '[]');
    if (reviewedItems.includes(attempt.slotId)) {
        setIsReviewed(true);
    }
  }, [attempt.slotId]);

  const handleReviewClick = () => {
    if (!isReviewed) {
        setShowAdDialog(true);
    } else {
        // If already reviewed, just show the dialog without an ad
        setShowReviewDialog(true);
    }
  };

  const handleAdFinished = () => {
    setShowAdDialog(false);
    const reviewedItems = JSON.parse(localStorage.getItem(reviewedStorageKey) || '[]');
    if (!reviewedItems.includes(attempt.slotId)) {
        reviewedItems.push(attempt.slotId);
        localStorage.setItem(reviewedStorageKey, JSON.stringify(reviewedItems));
    }
    setIsReviewed(true);
    setShowReviewDialog(true);
  };
  
  const attemptDate = new Date(attempt.timestamp);
  const isPerfectScore = attempt.score === attempt.totalQuestions;
  const isDisqualified = !!attempt.reason;
  const slotTiming = getSlotTimings(attempt.timestamp);

  return (
    <>
        <Card key={attempt.slotId} className="bg-card/80 border-primary/10 shadow-lg animate-fade-in-up">
        <CardHeader className='pb-4'>
            <div className="flex items-start gap-4">
                <div className="mt-1 flex-shrink-0">
                    {isDisqualified ? <Ban className="h-8 w-8 text-destructive" />
                    : isPerfectScore ? <Award className="h-8 w-8 text-yellow-500" />
                    : <CheckCircle className="h-8 w-8 text-green-600" />
                    }
                </div>
                <div className="flex-grow">
                    <CardTitle className="text-lg">{attempt.format} Quiz</CardTitle>
                    <CardDescription>Sponsored by {attempt.brand}</CardDescription>
                    <CardDescription className="pt-2">
                        {isDisqualified ? 'Disqualified (No Ball)' : `Scored ${attempt.score}/${attempt.totalQuestions}`}
                    </CardDescription>
                </div>
            </div>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{attemptDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{slotTiming}</span>
                </div>
            </div>
            <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleReviewClick} disabled={isDisqualified || isReviewed}>
                    {isReviewed ? <Check className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                    {isReviewed ? 'Reviewed' : 'Review'}
                </Button>
                
                <AnalysisDialog attempt={attempt}>
                    <Button variant="secondary" size="sm" disabled={isDisqualified}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Analysis
                    </Button>
                </AnalysisDialog>
            </div>
        </CardContent>
        </Card>
        
        {/* Ad before showing review */}
        {showAdDialog && (
            <AdDialog
                open={showAdDialog}
                onAdFinished={handleAdFinished}
                duration={adLibrary.resultsAd.duration}
                skippableAfter={adLibrary.resultsAd.skippableAfter}
                adTitle={adLibrary.resultsAd.title}
                adType={adLibrary.resultsAd.type}
                adUrl={adLibrary.resultsAd.url}
            >
                 <p className="text-xs text-muted-foreground mt-2">Watch this ad to review your answers. This is a one-time action per quiz.</p>
            </AdDialog>
        )}

        {/* Review Dialog */}
        <ReviewDialog
            open={showReviewDialog}
            onOpenChange={setShowReviewDialog}
            attempt={attempt}
        />
    </>
  );
};
