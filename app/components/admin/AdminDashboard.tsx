
'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, HelpCircle, Gift, Banknote, LogOut, Loader2, Trophy, BarChart } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, onSnapshot } from 'firebase/firestore';


const StatCard = ({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description?: string; }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
        </CardContent>
    </Card>
);

const DashboardSkeleton = () => (
    <Card>
        <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
             </div>
        </CardContent>
    </Card>
)

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const [globalStats, setGlobalStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  
  useEffect(() => {
    if (!db) return;
    const statsDocRef = doc(db, 'globals', 'stats');
    const unsubscribe = onSnapshot(statsDocRef, (doc) => {
        setGlobalStats(doc.exists() ? doc.data() : {});
        setStatsLoading(false);
    }, (error) => {
        console.error("Failed to listen to global stats:", error);
        toast({ title: "Error", description: "Could not load platform stats.", variant: "destructive" });
        setStatsLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);
  
  const handleLogout = async () => {
    if (!auth) return;
    try {
        await signOut(auth);
        toast({ title: "Signed Out" });
        router.replace('/admin/login');
    } catch (error) {
        toast({ title: "Sign Out Error", description: "Could not sign out. Please try again.", variant: "destructive" });
    }
  };

  if (loading || statsLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>An overview of the CricBlitz platform.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Sign Out
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                 <StatCard 
                    title="Quizzes Played" 
                    value={globalStats?.totalQuizzesPlayed?.toLocaleString() || '0'} 
                    icon={<BarChart className="h-4 w-4 text-muted-foreground" />} 
                />
                <StatCard 
                    title="Perfect Scores" 
                    value={globalStats?.totalPerfectScores?.toLocaleString() || '0'} 
                    icon={<Trophy className="h-4 w-4 text-muted-foreground" />} 
                />
                <StatCard 
                    title="Pending Questions" 
                    value="89" 
                    icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />} 
                    description="In moderation queue" 
                />
                <StatCard 
                    title="Active Ad Campaigns" 
                    value="12" 
                    icon={<Gift className="h-4 w-4 text-muted-foreground" />} 
                    description="Across all formats" 
                />
            </div>
            {/* Additional charts and tables will go here */}
        </CardContent>
    </Card>
  );
}

    