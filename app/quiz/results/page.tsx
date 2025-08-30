
'use client';

import type { QuizAttempt } from '@/ai/schemas';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { motion } from 'framer-motion';
import { Home, Sparkles, Eye, Ban, BadgeCheck, Award, Download, Share2, Check, Trophy, AlertTriangle } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useMemo, useState, memo, useCallback, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import jsPDF from 'jspdf';
import { Timestamp } from 'firebase/firestore';


const AdDialog = dynamic(() => import('@/components/AdDialog').then(mod => mod.AdDialog));
const AnalysisDialog = dynamic(() => import('@/components/history/AnalysisDialog'));
const ReviewDialog = dynamic(() => import('@/components/history/ReviewDialog'));

const LoadingSkeleton = () => (
    <PageWrapper title="Loading Results...">
        <div className="space-y-4 animate-pulse">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="space-y-3 pt-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        </div>
    </PageWrapper>
);

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, quizHistory, markAttemptAsReviewed } = useAuth();
  const { toast } = useToast();
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [showAdForReview, setShowAdForReview] = useState(false);
  const [slotTimings, setSlotTimings] = useState<string | null>(null);
  
  const slotId = searchParams.get('slotId');

  const attempt = useMemo(() => {
    if (!slotId) return null;
    return quizHistory.data.find(a => a.slotId === slotId) || null;
  }, [quizHistory.data, slotId]);

  const [currentAttempt, setCurrentAttempt] = useState(attempt);

  useEffect(() => {
    if (quizHistory.loading) return;

    if (!slotId) {
      toast({ title: "Invalid Link", description: "No quiz slot specified.", variant: "destructive" });
      router.replace('/');
      return;
    }
    
    const foundAttempt = quizHistory.data.find(a => a.slotId === slotId);
    if (foundAttempt) {
      setCurrentAttempt(foundAttempt);
      const getSlotTimings = (ts: number | Timestamp) => {
        const attemptDate = ts instanceof Timestamp ? ts.toDate() : new Date(ts);
        const minutes = attemptDate.getMinutes();
        const slotStartMinute = Math.floor(minutes / 10) * 10;
        
        const slotStartTime = new Date(attemptDate);
        slotStartTime.setMinutes(slotStartMinute, 0, 0);
        
        const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

        const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
      };
      setSlotTimings(getSlotTimings(foundAttempt.timestamp));
    } else if (!quizHistory.loading) {
       toast({ title: "Results not found", description: "Could not find quiz data for this slot.", variant: "destructive" });
       router.replace('/');
    }
  }, [slotId, quizHistory.data, quizHistory.loading, router, toast]);

  const handleViewAnswers = useCallback(() => {
    if (!currentAttempt) return;
    if (currentAttempt.reviewed) {
        setShowReviewDialog(true);
    } else {
        setShowAdForReview(true);
    }
  }, [currentAttempt]);
  
  const onAdFinished = useCallback(async () => {
    setShowAdForReview(false);
    if(currentAttempt?.slotId) {
        const { success } = await markAttemptAsReviewed(currentAttempt.slotId);
        if (success) {
            setCurrentAttempt(prev => prev ? { ...prev, reviewed: true } : null);
            toast({ title: "Success", description: "You can now view your answers." });
        } else {
            toast({ title: "Error", description: "Could not save review status. Please check connection.", variant: "destructive" });
        }
    }
    setShowReviewDialog(true);
  }, [currentAttempt, markAttemptAsReviewed, toast]);

  const handleDownloadCertificate = () => {
      if (!currentAttempt || !profile || !slotTimings) return;
      
      const doc = new jsPDF();
      doc.setDrawColor(212, 175, 55);
      doc.setLineWidth(1.5);
      doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10);
      doc.setFontSize(26);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 34, 34);
      doc.text('Certificate of Mastery', doc.internal.pageSize.width / 2, 30, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('For an outstanding innings by', doc.internal.pageSize.width / 2, 50, { align: 'center' });
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(212, 175, 55);
      doc.text(profile.name || 'Valued Player', doc.internal.pageSize.width / 2, 70, { align: 'center' });
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      doc.text('who achieved a perfect score in the', doc.internal.pageSize.width / 2, 90, { align: 'center' });
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`${currentAttempt.format} Quiz (${currentAttempt.brand})`, doc.internal.pageSize.width / 2, 105, { align: 'center' });
      
      const stars = Math.floor((profile.perfectScores || 1) / 5);
      if (stars > 0) {
        doc.setFontSize(20);
        doc.setTextColor(255, 215, 0);
        doc.text('★'.repeat(stars), doc.internal.pageSize.width / 2, 120, { align: 'center' });
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      const attemptDate = new Date(currentAttempt.timestamp as number);
      doc.text(`Date of Innings: ${attemptDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 30, 140);
      doc.text(`Match Slot: ${slotTimings}`, 30, 147);

      doc.setLineWidth(0.5);
      doc.line(130, 150, 180, 150);
      doc.setFontSize(10);
      doc.text('Official Scorer', 140, 155);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(34, 139, 34);
      doc.text('indcric', doc.internal.pageSize.width / 2, 170, { align: 'center' });
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text('Win ₹100 for every 100 seconds!', doc.internal.pageSize.width / 2, 175, { align: 'center' });
      doc.save(`indcric_${currentAttempt.format}_Certificate.pdf`);
      toast({ title: "Download Started", description: "Your certificate is being downloaded." });
  };

  const handleShare = async () => {
    if (!currentAttempt || !profile) return;
    const stars = Math.floor((profile.perfectScores || 0) / 5);
    const starText = stars > 0 ? ` I now have ${stars} star(s) on my profile! ⭐` : '';

    const shareData = {
        title: `I aced a quiz on indcric!`,
        text: `I just hit a century with a perfect score in the ${currentAttempt.format} quiz on indcric!${starText} Think you can match my score?`,
        url: window.location.origin,
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
            toast({ title: 'Copied to clipboard!', description: 'Sharing not available, so we copied the text for you.' });
        }
    } catch (error) {
        console.error('Share failed:', error);
        toast({ title: 'Sharing failed', description: 'Could not open share dialog.', variant: 'destructive'});
    }
  };

  const isPerfectScore = useMemo(() => currentAttempt?.score === currentAttempt?.totalQuestions && !currentAttempt?.reason, [currentAttempt]);
  const isDisqualified = useMemo(() => !!currentAttempt?.reason, [currentAttempt]);

  const motivationalLine = useMemo(() => {
    if (!currentAttempt) return "";
    if (isDisqualified) return "Fair play is key to the spirit of cricket.";
    if (isPerfectScore) return "Flawless century! You're a true champion.";
    if (currentAttempt.score >= 3) return "Good effort! Keep practicing.";
    return "Tough match, but every game is a learning experience!";
  }, [isDisqualified, isPerfectScore, currentAttempt]);

  const pageTitle = useMemo(() => {
    if (isDisqualified) return "Innings Disqualified";
    if (isPerfectScore) return "Perfect Score!";
    return "Quiz Complete!";
  }, [isDisqualified, isPerfectScore]);


  if (!currentAttempt || !slotTimings) {
    return <LoadingSkeleton />;
  }

  const adConfig = adLibrary.resultsAd;

  return (
    <PageWrapper title="Quiz Scorecard" showBackButton>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="space-y-6"
        >
             {isDisqualified && (
                <Alert variant="default" className="bg-yellow-900/50 text-yellow-300 border-yellow-700">
                    <AlertTriangle className="h-4 w-4 !text-yellow-300" />
                    <AlertTitle>Fair Play Review</AlertTitle>
                    <AlertDescription>
                        This quiz was disqualified due to a violation of our Fair Play policy. Your score for this round is recorded as zero.
                    </AlertDescription>
                </Alert>
            )}

            <Card className="text-center shadow-lg bg-card/80 overflow-hidden border-none">
                <CardHeader className="p-6">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="mx-auto bg-primary/10 p-4 rounded-full w-fit"
                    >
                        {isDisqualified ? <Ban className="h-12 w-12 text-yellow-400" /> : <Award className="h-12 w-12 text-primary" />}
                    </motion.div>
                    <CardTitle className="text-3xl font-bold mt-4">{pageTitle}</CardTitle>
                    <CardDescription>{currentAttempt.format} Quiz - Sponsored by {currentAttempt.brand}</CardDescription>
                    <CardDescription>Slot: {slotTimings}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-4">
                    {!isDisqualified ? (
                        <div className="space-y-4">
                            <div className="flex justify-around items-center">
                                <div className="text-center">
                                    <BadgeCheck className="h-8 w-8 text-primary mx-auto mb-1" />
                                    <p className="text-muted-foreground text-sm">You Scored</p>
                                    <p className="text-5xl font-bold tracking-tighter">
                                        <span className="text-primary">{currentAttempt.score}</span>/{currentAttempt.totalQuestions}
                                    </p>
                                </div>
                            </div>
                            <p className="text-lg font-semibold text-primary">{motivationalLine}</p>
                        </div>
                    ) : (
                         <div className="space-y-2">
                             <p className="font-semibold text-muted-foreground">Your score for this round is 0.</p>
                             <p className="text-xs text-muted-foreground">
                                 Please refer to our Fair Play policy for more details. If you believe this was an error, please contact support.
                             </p>
                         </div>
                    )}
                     <div className="grid grid-cols-1 gap-4">
                        <Button size="lg" variant="secondary" className="w-full h-14 text-base" onClick={() => router.push('/')}>
                            <Home className="mr-2 h-5 w-5" /> Go Home
                        </Button>
                         {!isDisqualified && (
                            <Button size="lg" variant="outline" className="w-full h-14 text-base" onClick={handleViewAnswers}>
                                {currentAttempt.reviewed ? <Check className="mr-2 h-4 w-4 text-green-500" /> : <Eye className="mr-2 h-4 w-4" />}
                                {currentAttempt.reviewed ? 'Answers Reviewed' : 'Review Answers (Ad)'}
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>
            
            {!isDisqualified && (
              <Card className="bg-card/80">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> AI Performance Analysis</CardTitle>
                      <CardDescription>Get a personalized analysis of your performance from our AI coach.</CardDescription>
                  </CardHeader>
                  <CardContent>
                        <Button size="lg" className="w-full" onClick={() => setIsAnalysisOpen(true)}>Generate Free Analysis</Button>
                  </CardContent>
              </Card>
            )}

            {isPerfectScore && (
              <Card className="bg-gradient-to-br from-yellow-400/20 to-amber-600/20 border-primary/30 shadow-lg">
                  <CardHeader className="text-center">
                      <motion.div 
                        className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2"
                        animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <Trophy className="h-8 w-8 text-primary" />
                      </motion.div>
                      <CardTitle className="text-xl">Century Scored! Honours Board Induction</CardTitle>
                      <CardDescription className="text-foreground/80">A flawless performance. Download your certificate and share your triumph!</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                        <Button size="lg" variant="secondary" onClick={handleDownloadCertificate} className="h-12">
                            <Download className="mr-2 h-4 w-4"/> Download
                        </Button>
                        <Button size="lg" variant="outline" onClick={handleShare} className="h-12">
                            <Share2 className="mr-2 h-4 w-4"/> Share
                        </Button>
                  </CardContent>
              </Card>
            )}
        </motion.div>
      
      {showAdForReview && adConfig && (
          <AdDialog
              open={showAdForReview}
              onOpenChange={setShowAdForReview}
              onAdFinished={onAdFinished}
              {...adConfig}
          >
            <p className="text-xs text-muted-foreground mt-2">Watch this ad to review your answers. This is a one-time action per quiz.</p>
          </AdDialog>
      )}

      {currentAttempt && (
         <>
            <ReviewDialog
                open={showReviewDialog}
                onOpenChange={setShowReviewDialog}
                attempt={currentAttempt}
            />
            <AnalysisDialog
                attempt={currentAttempt}
                open={isAnalysisOpen}
                onOpenChange={setIsAnalysisOpen}
            />
         </>
      )}
    </PageWrapper>
  );
};

function QuizResultsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <ResultsContent />
        </Suspense>
    );
}

export default memo(QuizResultsPage);
