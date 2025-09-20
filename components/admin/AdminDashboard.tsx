'use client';

import React, { useEffect, useState, memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, HelpCircle, BarChart, FileCheck, ShieldQuestion, Banknote } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

const StatCard = memo(({ title, value, icon, description, href }: { title: string; value: string; icon: React.ReactNode; description?: string; href: string; }) => (
    <Link href={href} className="block hover:scale-105 transition-transform duration-200">
        <Card className="shadow-md hover:shadow-lg transition-shadow bg-card/50 h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </CardContent>
        </Card>
    </Link>
));
StatCard.displayName = 'StatCard';

const DashboardSkeleton = () => (
    <div className="p-6">
        <div className="flex justify-between items-center mb-4">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
        </div>
    </div>
)

export default function AdminDashboard() {
  const { toast } = useToast();
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  useEffect(() => {
    if (!db) return;
    let isMounted = true;
    const statsDocRef = doc(db, 'globals', 'stats');

    const unsubscribe = onSnapshot(statsDocRef, (doc) => {
        if (!isMounted) return;
        setGlobalStats(doc.exists() ? doc.data() : {});
        setStatsLoading(false);
    }, (error) => {
        if (!isMounted) return;
        console.error("Failed to listen to global stats:", error);
        toast({ title: "Error", description: "Could not load platform stats.", variant: "destructive" });
        setStatsLoading(false);
    });

    return () => {
        isMounted = false;
        try {
            unsubscribe();
        } catch (e) {
            console.warn("Failed to unsubscribe from AdminDashboard listener", e);
        }
    };
  }, [toast]);
  

  if (statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="p-6">
        <div className="mb-6">
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">A high-level overview of the indcric platform.</p>
        </div>
        
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
             <StatCard 
                title="Quizzes Played" 
                value={globalStats?.totalQuizzesPlayed?.toLocaleString() || '0'} 
                icon={<BarChart className="h-4 w-4 text-muted-foreground" />} 
                href="/admin/users"
            />
            <StatCard 
                title="Pending Submissions" 
                value={globalStats?.pendingSubmissions?.toLocaleString() || '0'} 
                icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />} 
                description="In moderation queue"
                href="/admin/submissions"
            />
            <StatCard 
                title="Pending Payouts" 
                value={globalStats?.pendingPayouts?.toLocaleString() || '0'} 
                icon={<Banknote className="h-4 w-4 text-muted-foreground" />} 
                description="Awaiting processing"
                href="/admin/payouts"
            />
            <StatCard 
                title="Total Users" 
                value={globalStats?.totalUsers?.toLocaleString() || '0'} 
                icon={<Users className="h-4 w-4 text-muted-foreground" />} 
                description="Registered players"
                href="/admin/users"
            />
        </div>

        {/* Future chart components can be added here */}
    </div>
  );
}
