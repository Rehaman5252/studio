
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Clock, Calendar, Loader2 } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';


export default function CertificatesContent() {
  const { quizHistory, isHistoryLoading, userData } = useAuth();
  const { toast } = useToast();
  
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
    return (quizHistory as QuizAttempt[])
      .filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0)
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

    // Add a border
    doc.setDrawColor(218, 165, 32); // Gold
    doc.setLineWidth(1.5);
    doc.rect(5, 5, doc.internal.pageSize.width - 10, doc.internal.pageSize.height - 10);

    // Add title
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(218, 165, 32); // Gold
    doc.text('Certificate of Achievement', doc.internal.pageSize.width / 2, 30, { align: 'center' });

    // Add introductory text
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('This certifies that', doc.internal.pageSize.width / 2, 50, { align: 'center' });
    
    // Add user's name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(45, 85, 255); // A contrasting blue
    doc.text(userData?.name || 'Valued Player', doc.internal.pageSize.width / 2, 70, { align: 'center' });
    
    // Add achievement details
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('has successfully achieved a perfect score in the', doc.internal.pageSize.width / 2, 90, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(`${cert.format} Quiz (${cert.brand})`, doc.internal.pageSize.width / 2, 105, { align: 'center' });
    
    // Add date and slot
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`Awarded on: ${cert.date}`, 30, 130);
    doc.text(`Quiz Slot: ${cert.slot}`, 30, 137);

    // Add signature line
    doc.setLineWidth(0.5);
    doc.line(130, 135, 180, 135);
    doc.setFontSize(10);
    doc.text('Authorized Signature', 135, 140);


    // Add footer
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
    }
    try {
        if (navigator.share) {
            await navigator.share(shareData);
            toast({ title: "Shared!", description: "Certificate shared successfully." });
        } else {
            throw new Error("Web Share API not supported");
        }
    } catch (error) {
        console.error('Share failed:', error);
        toast({ title: "Sharing not available", description: "Could not share. Please try copying the link.", variant: "destructive" });
    }
  };

  if (isHistoryLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-10">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
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
                        <Award className="h-8 w-8 text-primary mt-1 flex-shrink-0" />
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
              <p className="font-semibold">No certificates yet!</p>
              <p>Score a perfect 5/5 in any quiz to earn your first certificate.</p>
            </CardContent>
          </Card>
        )}
    </>
  );
}
