
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Newspaper, HelpCircle, ServerCrash, WifiOff } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { mapFirestoreError } from '@/lib/utils';

const SubmissionItemSkeleton = () => (
    <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-md" />
            <div className="space-y-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-20" />
            </div>
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
    </div>
);

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Submissions</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const getStatusVariant = (status: string) => {
    switch (status) {
        case 'verified': return 'default';
        case 'rejected': return 'destructive';
        default: return 'secondary';
    }
};

const getIconForType = (type: string) => {
    switch (type) {
        case 'fact': return <FileText className="h-5 w-5 text-primary" />;
        case 'post': return <Newspaper className="h-5 w-5 text-primary" />;
        case 'question': return <HelpCircle className="h-5 w-5 text-primary" />;
        default: return null;
    }
}

export default function UserSubmissionsList() {
    const { user, loading: authLoading } = useAuth();
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading || !user) {
            setIsLoading(false);
            return;
        }

        const fetchSubmissions = async () => {
            if (!db) {
                setError("Database not available.");
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            setError(null);
            try {
                const q = query(
                    collection(db, 'userContributions'),
                    where('userId', '==', user.uid),
                    orderBy('submittedAt', 'desc'),
                    limit(10)
                );
                const querySnapshot = await getDocs(q);
                const fetchedSubmissions = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setSubmissions(fetchedSubmissions);
            } catch (e: any) {
                console.error("Failed to fetch user submissions:", e);
                const mapped = mapFirestoreError(e);
                setError(mapped.userMessage);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubmissions();
    }, [user, authLoading]);

    if (authLoading || isLoading) {
        return (
             <div className="mt-4 space-y-2">
                <SubmissionItemSkeleton />
                <SubmissionItemSkeleton />
            </div>
        )
    }

    if (error) {
        return <ErrorState message={error} />;
    }

    return (
        <div className="mt-6">
            <h3 className="text-md font-semibold mb-2">Recent Submissions</h3>
            <div className="space-y-2">
                {submissions.length > 0 ? (
                    submissions.map(sub => (
                        <Card key={sub.id} className="bg-card/50">
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                     <div className="text-muted-foreground">{getIconForType(sub.type)}</div>
                                     <div className="flex-1 overflow-hidden">
                                        <p className="font-semibold truncate capitalize text-sm">
                                            {sub.type === 'post' ? sub.title : sub.content || sub.question}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {sub.submittedAt ? new Date(sub.submittedAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                </div>
                                <Badge variant={getStatusVariant(sub.status)} className="capitalize">
                                    {sub.status.replace('-', ' ')}
                                </Badge>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">You haven't made any submissions yet.</p>
                )}
            </div>
        </div>
    );
}
