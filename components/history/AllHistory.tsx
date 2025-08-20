
'use client';

import React, { useState, useEffect } from 'react';
import { Award, Filter, Phone, Calendar as CalendarIcon } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, getDocs, limit, startAfter, endBefore, where, Timestamp } from 'firebase/firestore';
import { HistoryItem, HistoryItemSkeleton, ErrorState } from './QuizHistoryContent';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function AllHistory() {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const [fromDate, setFromDate] = useState<Date | undefined>();
  const [toDate, setToDate] = useState<Date | undefined>();

  const fetchHistory = async (filters: { from?: Date; to?: Date } = {}) => {
      if (!user) return;
      setIsLoading(true);
      setError(null);
      try {
          let constraints = [orderBy("timestamp", "desc")];
          if (filters.from) {
              constraints.push(where("timestamp", ">=", Timestamp.fromDate(filters.from)));
          }
          if (filters.to) {
              const toEndDate = new Date(filters.to);
              toEndDate.setHours(23, 59, 59, 999); // Include the whole day
              constraints.push(where("timestamp", "<=", Timestamp.fromDate(toEndDate)));
          } else {
              constraints.push(limit(20));
          }

          const q = query(collection(db, "users", user.uid, "quizAttempts"), ...constraints);
          const querySnapshot = await getDocs(q);
          const historyData = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
          setQuizHistory(historyData);
          
          if (!filters.from && !filters.to) {
            // Only fetch total count on initial load
            const countQuery = query(collection(db, "users", user.uid, "quizAttempts"));
            const countSnapshot = await getDocs(countQuery);
            setTotalAttempts(countSnapshot.size);
          }

      } catch (e: any) {
          console.error("Failed to fetch all quiz history:", e);
           if (e.code === 'unavailable' || e.message?.includes('offline')) {
              setError("You appear to be offline. Please check your connection to see your history.");
          } else if (e.code === 'failed-precondition') {
               setError("The required data is still being indexed. Please check back in a few moments.");
           } else {
              setError("Could not load your quiz history. Please try again later.");
          }
      } finally {
          setIsLoading(false);
      }
  }

  useEffect(() => {
    if (!authLoading && user) {
        fetchHistory();
    } else if (!authLoading && !user) {
        setIsLoading(false);
    }
  }, [user, authLoading]);

  const handleFilterApply = () => {
    fetchHistory({ from: fromDate, to: toDate });
  };
  
  const handleSendToPhone = () => {
    // This is a placeholder for actual SMS functionality which would require a backend service.
    toast({
        title: "Request Sent",
        description: "Your filtered history will be sent to your registered phone number shortly.",
    });
  };

  const renderFilters = () => {
    if (totalAttempts <= 20) return null;

    return (
        <Card className="bg-card/50 mb-4 p-4">
            <div className="flex flex-col sm:flex-row gap-2 items-center">
                <Filter className="h-5 w-5 text-primary mr-2" />
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !fromDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {fromDate ? format(fromDate, "PPP") : <span>From date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus /></PopoverContent>
                </Popover>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !toDate && "text-muted-foreground")}>
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {toDate ? format(toDate, "PPP") : <span>To date</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus /></PopoverContent>
                </Popover>
                <Button onClick={handleFilterApply} className="w-full sm:w-auto">Apply</Button>
            </div>
             {fromDate && toDate && (
                <div className="mt-2">
                    <Button onClick={handleSendToPhone} variant="secondary" size="sm" className="w-full">
                        <Phone className="mr-2 h-4 w-4"/> Send to Phone
                    </Button>
                </div>
            )}
        </Card>
    );
  };
  
  if (isLoading || authLoading) {
    return (
        <div className="space-y-4">
            {[...Array(5)].map((_, i) => <HistoryItemSkeleton key={i} />)}
        </div>
    );
  }

  if (error) {
    return <ErrorState message={error} />;
  }
  
  if (quizHistory.length === 0) {
    return (
        <Card className="bg-card/80">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
              <p className="font-semibold text-lg text-foreground">No History Yet!</p>
              <p>Your past quizzes will appear here once you've played a game.</p>
            </CardContent>
        </Card>
    );
  }
  
  return (
      <div className="space-y-4">
        {renderFilters()}
        {quizHistory.map((attempt) => (
          <HistoryItem key={attempt.slotId} attempt={attempt} />
        ))}
      </div>
  );
}
