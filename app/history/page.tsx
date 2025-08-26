
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { History, ServerCrash, WifiOff, Award, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import RecentHistory from '@/components/history/RecentHistory';
import AllHistory from '@/components/history/AllHistory';
import PerfectScoresHistory from '@/components/history/PerfectScoresHistory';
import PageWrapper from '@/components/PageWrapper';

const HistorySkeleton = () => (
    <div className="space-y-4 pt-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
    </div>
);

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading History</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

export default function HistoryPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('recent');
  
  const renderContent = () => {
    if (loading) return <HistorySkeleton />;

    if (!user) {
        let promptProps;
        switch (activeTab) {
            case 'all':
                promptProps = { 
                    icon: Trophy, 
                    title: "View Your Career Stats", 
                    description: "Sign in to access your complete match history and track your progress over time." 
                };
                break;
            case 'perfect':
                promptProps = { 
                    icon: Award, 
                    title: "Your Hall of Fame", 
                    description: "Sign in to see all your perfect scores and celebrate your moments of glory!" 
                };
                break;
            default:
                promptProps = { 
                    icon: History, 
                    title: "Check Your Recent Form", 
                    description: "Just finished a match? Sign in to see how you performed in your last few innings." 
                };
        }
        return (
            <div className="pt-8">
                <LoginPrompt {...promptProps} />
            </div>
        );
    }
    

    return (
        <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <TabsContent value="recent" forceMount={activeTab === 'recent'}>
                <RecentHistory />
            </TabsContent>
            <TabsContent value="all" forceMount={activeTab === 'all'}>
                <AllHistory />
            </TabsContent>
            <TabsContent value="perfect" forceMount={activeTab === 'perfect'}>
                <PerfectScoresHistory />
            </TabsContent>
        </motion.div>
    )
  }

  return (
    <PageWrapper title="My Innings">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="recent">Recent</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="perfect">Perfect Scores</TabsTrigger>
            </TabsList>
            
            <div className="mt-4">
                {renderContent()}
            </div>
        </Tabs>
    </PageWrapper>
  );
}
