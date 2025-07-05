
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Loader2, Clock, Calendar } from 'lucide-react';
import useRequireAuth from '@/hooks/useRequireAuth';
import { mockQuizHistory } from '@/lib/mockData';

export default function CertificatesPage() {
  const { loading } = useRequireAuth();

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
    return mockQuizHistory
      .filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0)
      .map(attempt => ({
        id: attempt.slotId + attempt.format,
        title: `${attempt.format} Masterclass Certificate`,
        date: new Date(attempt.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        slot: getSlotTimings(attempt.timestamp),
        brand: attempt.brand,
        format: attempt.format,
      }));
  }, []);
  
  if (loading) {
      return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        {certificates.length > 0 ? (
          certificates.map((cert) => (
            <Card key={cert.id} className="bg-card/80 border-primary/10 shadow-lg">
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
                <Button variant="secondary" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="bg-card/80">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="font-semibold">No certificates yet!</p>
              <p>Score a perfect 5/5 in any quiz to earn your first certificate.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
