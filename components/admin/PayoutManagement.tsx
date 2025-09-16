
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Unsubscribe, getDoc, doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Banknote, ServerCrash, WifiOff, Check, X, Clock, RefreshCw, AlertTriangle, User, Calendar } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { mapFirestoreError } from '@/lib/utils';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { processPayout } from '@/ai/flows/process-payout';
import { useAuth } from '@/context/AuthProvider';

type Payout = {
    id: string;
    userId: string;
    userName?: string;
    userUpi?: string;
    status: 'pending' | 'completed' | 'failed';
    amount: number;
    createdAt: any;
};

const PayoutItemSkeleton = () => (
    <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
            </div>
        </div>
        <Skeleton className="h-8 w-20 rounded-md" />
    </div>
);

const ErrorState = ({ message, onRetry }: { message: string, onRetry: () => void }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Payouts</AlertTitle>
        <AlertDescription className='mb-4'>{message}</AlertDescription>
        <Button onClick={onRetry} variant="secondary"><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
    </Alert>
);

const PayoutCard = ({ payout, onProcess, isProcessing }: { payout: Payout, onProcess: (id: string, newStatus: 'completed' | 'failed') => void, isProcessing: boolean }) => {
    return (
        <Accordion type="single" collapsible className="w-full bg-card/50 rounded-lg">
            <AccordionItem value={payout.id} className="border-b-0">
                <AccordionTrigger className="p-3 hover:no-underline">
                     <div className="flex items-center gap-3 overflow-hidden w-full">
                        <div className="text-muted-foreground"><Banknote className="h-5 w-5 text-primary" /></div>
                        <div className="flex-1 overflow-hidden text-left">
                            <p className="font-semibold truncate text-sm">
                                {payout.userName || 'Unknown User'} - ₹{payout.amount}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {payout.createdAt ? new Date(payout.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                            </p>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent className="p-4 bg-background/50 border-t">
                    <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><strong>User:</strong> {payout.userName} ({payout.userId})</p>
                        <p className="flex items-center gap-2"><Banknote className="h-4 w-4 text-muted-foreground" /><strong>UPI:</strong> {payout.userUpi || 'Not Provided'}</p>
                         <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><strong>Requested:</strong> {payout.createdAt ? new Date(payout.createdAt.seconds * 1000).toLocaleString() : 'N/A'}</p>
                    </div>
                    {payout.status === 'pending' && (
                        <div className="flex justify-end gap-2 mt-4">
                            <Button size="sm" variant="destructive" onClick={() => onProcess(payout.id, 'failed')} disabled={isProcessing}><X className="h-4 w-4 mr-1" /> Mark as Failed</Button>
                            <Button size="sm" onClick={() => onProcess(payout.id, 'completed')} disabled={isProcessing}><Check className="h-4 w-4 mr-1" /> Mark as Paid</Button>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
}

export default function PayoutManagement() {
    const { user } = useAuth();
    const [payouts, setPayouts] = useState<Payout[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'pending' | 'completed' | 'failed'>('pending');
    const [processingId, setProcessingId] = useState<string | null>(null);
    const { toast } = useToast();

    const fetchPayouts = useCallback(() => {
        if (!db) {
            setError("Database not available.");
            setIsLoading(false);
            return () => {};
        }

        setIsLoading(true);
        setError(null);

        const q = query(
            collection(db, 'payouts'),
            where('status', '==', activeTab),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, async (querySnapshot) => {
            const fetchedPayouts: Payout[] = await Promise.all(
                querySnapshot.docs.map(async (payoutDoc) => {
                    const data = payoutDoc.data();
                    let userName, userUpi;
                    try {
                        const userDoc = await getDoc(doc(db, 'users', data.userId));
                        if(userDoc.exists()) {
                            userName = userDoc.data().name;
                            userUpi = userDoc.data().upi;
                        }
                    } catch (e) {
                        console.warn(`Could not fetch user details for payout ${payoutDoc.id}`, e);
                    }
                    return {
                        id: payoutDoc.id,
                        ...data,
                        userName,
                        userUpi
                    } as Payout;
                })
            );
            setPayouts(fetchedPayouts);
            setIsLoading(false);
        }, (err: any) => {
            console.error("Failed to fetch payouts:", err);
            const mapped = mapFirestoreError(err);
            setError(mapped.userMessage);
            setIsLoading(false);
        });

        return unsubscribe;
    }, [activeTab]);
    
    useEffect(() => {
       const unsubscribe = fetchPayouts();
       return () => {
           if(typeof unsubscribe === 'function') unsubscribe();
       };
    }, [fetchPayouts]);
    
    const handleProcess = async (id: string, newStatus: 'completed' | 'failed') => {
        if (!user) {
            toast({ title: "Error", description: "Admin user not found.", variant: 'destructive' });
            return;
        }
        setProcessingId(id);
        const result = await processPayout({ payoutId: id, status: newStatus, adminId: user.uid });
        if (result.success) {
            toast({ title: `Payout ${newStatus}`, description: result.message });
        } else {
            toast({ title: "Error", description: result.message, variant: 'destructive' });
        }
        setProcessingId(null);
    }

    const renderContent = () => {
        if (isLoading) {
            return Array.from({length: 5}).map((_, i) => <PayoutItemSkeleton key={i} />)
        }
        if (error) {
            return <ErrorState message={error} onRetry={fetchPayouts} />;
        }
        if (payouts.length === 0) {
            return <p className="text-sm text-muted-foreground text-center py-8">No {activeTab} payouts found.</p>
        }
        return (
             <div className="space-y-2">
                {payouts.map(sub => (
                    <PayoutCard 
                        key={sub.id} 
                        payout={sub}
                        onProcess={handleProcess}
                        isProcessing={processingId === sub.id}
                    />
                ))}
            </div>
        );
    }

    return (
       <div className="p-6">
            <div className="mb-4">
               <h1 className="text-2xl font-bold">Payout Management</h1>
               <p className="text-muted-foreground">Review and process winner payouts.</p>
           </div>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="pending">Pending</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                    <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                <div className="mt-4">
                    {renderContent()}
                </div>
            </Tabs>
       </div>
    );
}
