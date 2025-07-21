
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Clock, Calendar, WifiOff, ServerCrash, Trophy } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

const CertificateItemSkeleton = () => (
    <div className="space-y-4">
        <Card className="bg-card/80 border-primary/10 shadow-lg">
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

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Certificates</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

export default function CertificatesContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) {
        if (!user) setIsLoading(false);
        return;
    }

    const fetchHistory = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const db = getFirebaseFirestore();
            if (!db) {
              throw new Error("You appear to be offline. Please check your connection to see your certificates.");
            }
            const q = query(collection(db, "users", user.uid, "quizAttempts"), orderBy("timestamp", "desc"));
            const querySnapshot = await getDocs(q);
            const historyData = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
            setQuizHistory(historyData);
        } catch (e: any) {
            console.error("Failed to fetch certificate data:", e);
            if (e.code === 'unavailable' || e.message?.includes('offline')) {
                setError("You appear to be offline. Please check your connection to see your certificates.");
            } else {
                setError(e.message || "Could not load your certificates. Please try again later.");
            }
        } finally {
            setIsLoading(false);
        }
    }
    fetchHistory();
  }, [user, authLoading]);
  
  const getSlotTimings = (timestamp: number) => {
    const attemptDate = new Date(timestamp);
    const minutes = attemptDate.getMinutes();
    const slotStartMinute = Math.floor(minutes / 10) * 10;
    
    const slotStartTime = new Date(attemptDate);
    slotStartTime.setMinutes(slotStartMinute, 0, 0);
    
    const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
  };
  
  const certificates = useMemo(() => {
    if (!quizHistory) return [];
    return quizHistory
      .filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0 && !attempt.reason)
      .map(attempt => ({
        id: attempt.slotId + attempt.format,
        title: `${attempt.format} Masterclass Certificate`,
        date: new Date(attempt.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        slot: getSlotTimings(attempt.timestamp),
        brand: attempt.brand,
        format: attempt.format,
      }));
  }, [quizHistory]);

  const handleDownload = (cert: typeof certificates[0]) => {
    const doc = new jsPDF();

    doc.setDrawColor(218, 165, 32); 
    doc.setLineWidth(1.5);
    doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10);

    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(218, 165, 32);
    doc.text('Certificate of Achievement', doc.internal.pageSize.width / 2, 30, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('This certifies that', doc.internal.pageSize.width / 2, 50, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 85, 255);
    doc.text(profile?.name || 'Valued Player', doc.internal.pageSize.width / 2, 70, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('has successfully achieved a perfect score in the', doc.internal.pageSize.width / 2, 90, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${cert.format} Quiz (${cert.brand})`, doc.internal.pageSize.width / 2, 105, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Awarded on: ${cert.date}`, 30, 130);
    doc.text(`Quiz Slot: ${cert.slot}`, 30, 137);

    doc.setLineWidth(0.5);
    doc.line(130, 135, 180, 135);
    doc.setFontSize(10);
    doc.text('Authorized Signature', 135, 140);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(218, 165, 32);
    doc.text('indcric', doc.internal.pageSize.width / 2, 160, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text('The Ultimate Cricket Quiz', doc.internal.pageSize.width / 2, 165, { align: 'center' });
    
    doc.save(`indcric_${cert.format}_Certificate.pdf`);
    
    toast({
        title: "Download Started",
        description: "Your certificate is being downloaded as a PDF.",
    });
  };

  const handleShare = async (cert: typeof certificates[0]) => {
    const shareData = {
        title: `I earned an indcric Certificate!`,
        text: `I just got a perfect score in the ${cert.format} quiz on indcric! Think you can beat me?`,
        url: window.location.href,
    };
    try {
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
           navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
           toast({ title: 'Copied to clipboard', description: 'Sharing is not available, so we copied the text for you!' });
        }
    } catch (error) {
        console.error('Share failed:', error);
    }
  };


  if (isLoading || authLoading) {
    return (
        <div className="space-y-4">
            <CertificateItemSkeleton />
            <CertificateItemSkeleton />
        </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }
  
  return (
    <>
        {certificates.length > 0 ? (
          <div className="space-y-4">
            {certificates.map((cert) => (
              <div key={cert.id}>
                <Card className="bg-card/80 border-primary/10 shadow-lg">
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
          <Card className="bg-card/80">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="font-semibold text-lg text-foreground">No certificates yet!</p>
              <p>Score a perfect 5/5 in any quiz to earn your first certificate.</p>
            </CardContent>
          </Card>
        )}
    </>
  );
}
