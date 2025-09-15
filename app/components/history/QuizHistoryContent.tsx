
'use client';

import React, { useState, memo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Ban, Sparkles, Calendar, CheckCircle, Clock, Eye, ServerCrash, WifiOff, Check, Loader2 } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AdDialog } from '@/components/AdDialog';
import { adLibrary } from '@/lib/ads';
import AnalysisDialog from '@/components/history/AnalysisDialog';
import ReviewDialog from '@/components/history/ReviewDialog';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { normalizeTimestamp } from '@/lib/dates';

export const HistoryItemSkeleton = () => (
    <Card className="bg-card/80 shadow-lg">
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
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const getSlotTimings = (date: Date | null): string => {
    if (!date) return 'Invalid Time';

    const minutes = date.getMinutes();
    const slotStartMinute = Math.floor(minutes / 10) * 10;
    
    const slotStartTime = new Date(date);
    slotStartTime.setMinutes(slotStartMinute, 0, 0);
    
    const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

    const formatTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
};

const getFormattedDate = (date: Date | null): string => {
    if (!date) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};


const HistoryItemComponent = ({ attempt }: { attempt: QuizAttempt }) => {
  const { markAttemptAsReviewed } = useAuth();
  const { toast } = useToast();
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isReviewed, setIsReviewed] = useState(attempt.reviewed || false);
  const [isReviewing, setIsReviewing] = useState(false);

  const isDisqualified = !!attempt.reason;

  const handleReviewClick = useCallback(() => {
    // This check prevents any action if the process is already running or completed.
    if (isDisqualified || isReviewing) return;
    
    // If already reviewed, just open the dialog directly. This handles out-of-sync UI.
    if (isReviewed) {
        setShowReviewDialog(true);
        return;
    }
    
    // Start the review process: disable button and show ad.
    setIsReviewing(true);
    setShowAdDialog(true);
  }, [isDisqualified, isReviewed, isReviewing]);

  const handleAdFinished = useCallback(async () => {
    setShowAdDialog(false);
    try {
      const { success, reason } = await markAttemptAsReviewed(attempt.slotId);
      if (success) {
        setIsReviewed(true);
        toast({
          title: "Success",
          description: "You can now review your answers."
        });
        setShowReviewDialog(true);
      } else {
        toast({
          title: "Update Failed",
          description: `Could not save review state: ${reason || 'Please check connection.'}`,
          variant: "destructive"
        });
      }
    } finally {
      // Whether success or fail, the "reviewing" process is over.
      setIsReviewing(false);
    }
  }, [attempt.slotId, markAttemptAsReviewed, toast]);

  const handleAdDialogClose = (open: boolean) => {
    if (!open) {
        // Only reset isReviewing if the user closes the ad dialog *before* the ad finishes.
        // This handles the user abandoning the review process.
        if (isReviewing && !showReviewDialog) {
            setIsReviewing(false);
        }
    }
    setShowAdDialog(open);
  }
  
  const normalizedDate = normalizeTimestamp(attempt.timestamp);
  const isPerfectScore = attempt.score === attempt.totalQuestions && !attempt.reason;
  const slotTiming = getSlotTimings(normalizedDate);
  const formattedDate = getFormattedDate(normalizedDate);

  return (
    <>
        <Card key={attempt.slotId} className="bg-card/80 shadow-lg animate-fade-in-up">
            <CardHeader className='pb-4'>
                <div className="flex items-start gap-4">
                    <div className="mt-1 flex-shrink-0">
                        {isDisqualified ? <Ban className="h-8 w-8 text-destructive" />
                        : isPerfectScore ? <Award className="h-8 w-8 text-primary" />
                        : <CheckCircle className="h-8 w-8 text-primary" />
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
                        <Calendar className="h-3.5 w-3.5 text-primary" />
                        <span>{formattedDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-primary" />
                        <span>{slotTiming}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleReviewClick}
                      disabled={isDisqualified || isReviewing || isReviewed}
                    >
                      {isReviewing ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isReviewed ? (
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                      ) : (
                        <Eye className="mr-2 h-4 w-4 text-primary" />
                      )}
                      {isReviewing ? 'Processing...' : isReviewed ? 'Reviewed' : 'Review'}
                    </Button>
                    
                    <Button variant="secondary" size="sm" onClick={() => setIsAnalysisOpen(true)} disabled={isDisqualified}>
                        <Sparkles className="mr-2 h-4 w-4 text-primary" />
                        Analysis
                    </Button>
                </div>
            </CardContent>
        </Card>
        
        {showAdDialog && (
            <AdDialog
                open={showAdDialog}
                onOpenChange={handleAdDialogClose}
                onAdFinished={handleAdFinished}
                {...adLibrary.resultsAd}
            >
                 <p className="text-xs text-muted-foreground mt-2">Watch this ad to review your answers. This is a one-time action per quiz.</p>
            </AdDialog>
        )}
        
        {attempt && (
          <ReviewDialog
            open={showReviewDialog}
            onOpenChange={setShowReviewDialog}
            attempt={attempt}
          />
        )}

        {attempt && (
          <AnalysisDialog
            open={isAnalysisOpen}
            onOpenChange={setIsAnalysisOpen}
            attempt={attempt}
          />
        )}
    </>
  );
};
export const HistoryItem = memo(HistoryItemComponent);
