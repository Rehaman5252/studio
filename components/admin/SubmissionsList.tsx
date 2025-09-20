'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Newspaper, HelpCircle, ServerCrash, WifiOff, Check, X, Clock, RefreshCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from '@/components/ui/button';
import { approveContribution } from '@/ai/flows/approve-contribution';
import { rejectContribution } from '@/ai/flows/reject-contribution';
import { useToast } from '@/hooks/use-toast';
import { mapFirestoreError } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, } from "@/components/ui/accordion"

type Contribution = {
    id: string;
    type: 'fact' | 'post' | 'question';
    status: 'under-verification' | 'verified' | 'rejected';
    submittedAt: any;
    [key: string]: any;
};

const SubmissionItemSkeleton = () => (
    <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
    </div>
);

const ErrorState = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Submissions</AlertTitle>
        <AlertDescription className='mb-4'>{message}</AlertDescription>
        <Button onClick={onRetry} variant="secondary" size="sm"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
    </Alert>
);

const getIconForType = (type: string) => {
    switch (type) {
        case 'fact': return <FileText className="h-5 w-5 text-primary" />;
        case 'post': return <Newspaper className="h-5 w-5 text-primary" />;
        case 'question': return <HelpCircle className="h-5 w-5 text-primary" />;
        default: return null;
    }
}

const SubmissionCard = ({ sub, onApprove, onReject, isProcessing }: { sub: Contribution, onApprove: (id: string) => void, onReject: (id: string) => void, isProcessing: boolean }) => {
    return (
        <Accordion type="single" collapsible className="w-full bg-card/50 rounded-lg">
            <AccordionItem value={sub.id} className="border-b-0">
                <AccordionTrigger className="p-3 hover:no-underline">
                     <div className="flex items-center gap-3 overflow-hidden w-full">
                        <div className="text-muted-foreground">{getIconForType(sub.type)}</div>
                        <div className="flex-1 overflow-hidden text-left">
                            <p className="font-semibold truncate capitalize text-sm">
                                {sub.type === 'post' ? sub.title : sub.content || sub.question}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-background/50 border-t">
                    <div className="space-y-2 text-sm">
                       {sub.type === 'fact' && <p><strong>Fact:</strong> {sub.content}</p>}
                       {sub.type === 'post' && <>
                            <p><strong>Title:</strong> {sub.title}</p>
                            <p><strong>Content:</strong> {sub.content}</p>
                       </>}
                       {sub.type === 'question' && <>
                            <p><strong>Question:</strong> {sub.question}</p>
                            <p><strong>Options:</strong> {sub.options.join(', ')}</p>
                            <p><strong>Correct Answer:</strong> {sub.correctAnswer}</p>
                            <p><strong>Explanation:</strong> {sub.explanation}</p>
                       </>}
                    </div>
                    {sub.status === 'under-verification' && (
                        <div className="flex justify-end gap-2 mt-4">
                            <Button size="sm" variant="destructive" onClick={() => onReject(sub.id)} disabled={isProcessing}><X className="h-4 w-4 mr-1" /> Reject</Button>
                            <Button size="sm" onClick={() => onApprove(sub.id)} disabled={isProcessing}><Check className="h-4 w-4 mr-1" /> Approve</Button>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

export default function SubmissionsList() {
    const [submissions, setSubmissions] = useState<Contribution[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchSubmissions = useCallback(() => {
        if (!db) {
            setError("Database not available.");
            setIsLoading(false);
            return () => {};
        }

        setIsLoading(true);
        setError(null);
        
        const statusMap = {
            pending: 'under-verification',
            verified: 'verified',
            rejected: 'rejected'
        };

        const q = query(
            collection(db, 'userContributions'),
            where('status', '==', statusMap[activeTab as keyof typeof statusMap]),
            orderBy('submittedAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const fetchedSubmissions = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            } as Contribution));
            setSubmissions(fetchedSubmissions);
            setIsLoading(false);
        }, (err: any) => {
            console.error("Failed to fetch user submissions:", err);
            const mapped = mapFirestoreError(err);
            setError(mapped.userMessage);
            setIsLoading(false);
        });

        return unsubscribe;
    }, [activeTab]);
    
    useEffect(() => {
       const unsubscribe = fetchSubmissions();
       return () => {
           if(typeof unsubscribe === 'function') unsubscribe();
       };
    }, [fetchSubmissions]);

    const handleApprove = async (id: string) => {
        setProcessingId(id);
        const result = await approveContribution({ contributionId: id });
        if (result.success) {
            toast({ title: "Approved", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }
        setProcessingId(null);
    }
    
    const handleReject = async (id: string) => {
        setProcessingId(id);
        const result = await rejectContribution({ contributionId: id });
         if (result.success) {
            toast({ title: "Rejected", description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }
        setProcessingId(null);
    }

    const renderContent = () => {
        if (isLoading) {
            return Array.from({length: 5}).map((_, i) => <SubmissionItemSkeleton key={i} />)
        }
        if (error) {
            return <ErrorState message={error} onRetry={fetchSubmissions} />;
        }
        if (submissions.length === 0) {
            return <p className="text-sm text-muted-foreground text-center py-8">No {activeTab} submissions found.</p>
        }
        return (
             <div className="space-y-2">
                {submissions.map(sub => (
                    <SubmissionCard 
                        key={sub.id} 
                        sub={sub}
                        onApprove={handleApprove}
                        onReject={handleReject}
                        isProcessing={processingId === sub.id}
                    />
                ))}
            </div>
        );
    }

    return (
       <Card>
           <CardHeader>
               <CardTitle>Moderate Submissions</CardTitle>
               <CardDescription>Review content submitted by users.</CardDescription>
           </CardHeader>
           <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="verified">Verified</TabsTrigger>
                        <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    </TabsList>
                    <div className="mt-4">
                        {renderContent()}
                    </div>
                </Tabs>
           </CardContent>
       </Card>
    );
}
