
'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Clock, Calendar, Loader2 } from 'lucide-react';
import { mockQuizHistory, type QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { db, isFirebaseConfigured } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

export default function CertificatesContent() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      if (!isFirebaseConfigured || !db || !user) {
        setHistory(mockQuizHistory);
        setIsLoading(false);
        return;
      }

      try {
        const historyCollection = collection(db, 'users', user.uid, 'quizHistory');
        const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(50));
        const querySnapshot = await getDocs(q);
        const fetchedHistory = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
        setHistory(fetchedHistory);
      } catch (error) {
        console.error("Failed to fetch quiz history:", error);
        setHistory(mockQuizHistory); // Fallback to mock on error
      } finally {
        setIsLoading(false);
      }
    }
    fetchHistory();
  }, [user]);

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
    return history
      .filter(attempt => attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0)
      .map(attempt => ({
        id: attempt.slotId + attempt.format,
        title: `${attempt.format} Masterclass Certificate`,
        date: new Date(attempt.timestamp).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        slot: getSlotTimings(attempt.timestamp),
        brand: attempt.brand,
        format: attempt.format,
      }));
  }, [history]);

  if (isLoading) {
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
