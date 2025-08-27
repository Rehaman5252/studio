
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { History, Award, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';

const RecentHistory = dynamic(() => import('@/components/history/RecentHistory'), {
    loading: () => <HistorySkeleton count={3} />,
    ssr: false,
});
const AllHistory = dynamic(() => import('@/components/history/AllHistory'), {
    loading: () => <HistorySkeleton count={5} />,
    ssr: false,
});
const PerfectScoresHistory = dynamic(() => import('@/components/history/PerfectScoresHistory'), {
    loading: () => <HistorySkeleton count={2} />,
    ssr: false,
});
const LoginPrompt = dynamic(() => import('@/components/auth/LoginPrompt'), {
    loading: () => <Skeleton className="h-56 w-full" />,
});


const HistorySkeleton = ({ count = 3 }: { count?: number}) => (
    <div className="space-y-4 pt-4">
        {Array.from({ length: count }).map((_, i) => (
             <Skeleton key={i} className="h-24 w-full" />
        ))}
    </div>
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
