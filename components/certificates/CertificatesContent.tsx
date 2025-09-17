
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Clock, Calendar, WifiOff, ServerCrash, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { normalizeTimestamp } from '@/lib/dates';
import type { QuizAttempt } from '@/ai/schemas';
import { EmptyState } from '../EmptyState';

const CertificateItemSkeleton = () => (
    <div className="space-y-4">
        <Card className="bg-card/80 shadow-lg">
            <CardHeader>
                <div className="flex items-start gap-4">
                    <Skeleton className="h-8 w-8 rounded-md mt-1 flex-shrink-0" />
                    <div className="flex-grow space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-3 w-5/6" />
                        <Skeleton className="h-3 w-3/4" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
                <Skeleton className="h-9 w-24 rounded-md" />
                <Skeleton className="h-9 w-20 rounded-md" />
            </CardContent>
        </Card>
    </div>
);

const ErrorStateDisplay = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Certificates</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

export default function CertificatesContent() {
  const { profile, quizHistory } = useAuth();
  const { toast } = useToast();
  
  const getSlotTimings = (timestamp: any) => {
    const attemptDate = normalizeTimestamp(timestamp);
    if (!attemptDate) return 'Invalid Time';

    const minutes = attemptDate.getMinutes();
    const slotStartMinute = Math.floor(minutes / 10) * 10;
    
    const slotStartTime = new Date(attemptDate);
    slotStartTime.setMinutes(slotStartMinute, 0, 0);
    
    const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

    const formatTime = (date: Date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Kolkata' });

    return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
  };
  
  const certificates = useMemo(() => {
    return quizHistory.data
      .filter((attempt: QuizAttempt) => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0 && !attempt.reason)
      .map((attempt: QuizAttempt) => {
          const attemptDate = normalizeTimestamp(attempt.timestamp);
          return {
            id: attempt.slotId + attempt.format,
            title: `${attempt.format} Masterclass Certificate`,
            date: attemptDate ? attemptDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) : 'N/A',
            slot: getSlotTimings(attempt.timestamp),
            brand: attempt.brand,
            format: attempt.format,
          }
      });
  }, [quizHistory.data]);

  const handleDownload = (cert: typeof certificates[0]) => {
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
    doc.text(profile?.name || 'Valued Player', doc.internal.pageSize.width / 2, 70, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('who achieved a perfect score in the', doc.internal.pageSize.width / 2, 90, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${cert.format} Quiz (${cert.brand})`, doc.internal.pageSize.width / 2, 105, { align: 'center' });
    
    const stars = Math.floor((profile?.perfectScores || 1) / 5);
    if (stars > 0) {
      doc.setFontSize(20);
      doc.setTextColor(255, 215, 0);
      doc.text('★'.repeat(stars), doc.internal.pageSize.width / 2, 120, { align: 'center' });
    }
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Date of Innings: ${cert.date}`, 30, 140);
    doc.text(`Match Slot: ${cert.slot}`, 30, 147);

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
    doc.text('win ₹100 for every 100 seconds!', doc.internal.pageSize.width / 2, 175, { align: 'center' });
    
    doc.save(`indcric_${cert.format}_Certificate.pdf`);
    
    toast({
        title: "Download Started",
        description: "Your certificate is being downloaded as a PDF.",
    });
  };

  const handleShare = async (cert: typeof certificates[0]) => {
    if (!profile) return;
    const stars = Math.floor((profile.perfectScores || 0) / 5);
    const starText = stars > 0 ? ` I now have ${stars} star(s) on my profile! ⭐` : '';

    const shareData = {
        title: `I aced a quiz on indcric!`,
        text: `I just hit a century with a perfect score in the ${cert.format} quiz on indcric!${starText} Think you can match my score?`,
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
    }
  };


  if (quizHistory.loading) {
    return (
        <div className="space-y-4">
            <CertificateItemSkeleton />
            <CertificateItemSkeleton />
        </div>
    );
  }

  if (quizHistory.error) {
    return <ErrorStateDisplay message={quizHistory.error} />;
  }
  
  return (
    <>
        {certificates.length > 0 ? (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id}>
                <Card className="bg-card/80 shadow-lg">
                  <CardHeader>
                    <div className="flex items-start gap-4">
                        <Trophy className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
                        <div className="flex-grow">
                            <CardTitle className="text-lg">{cert.title}</CardTitle>
                            <CardDescription>
                                For the {cert.brand} {cert.format} quiz.
                            </CardDescription>
                            <div className="text-xs text-muted-foreground mt-2 space-y-1">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    <span>Awarded on: {cert.date}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-3.5 w-3.5" />
                                    <span>Slot: {cert.slot}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex justify-end gap-2">
                    <Button variant="secondary" size="sm" onClick={() => handleDownload(cert)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleShare(cert)}>
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState 
            Icon={Award}
            title="No certificates yet!"
            description="Score a perfect 5/5 in any quiz to earn your first certificate."
          />
        )}
    </>
  );
}
