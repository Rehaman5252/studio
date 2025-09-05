
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { History } from 'lucide-react';
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
  
  if (loading) {
    return (
      <PageWrapper title="My Innings" showBackButton>
          <HistorySkeleton />
      </PageWrapper>
    );
  }

  if (!user) {
    return (
      <PageWrapper title="My Innings" showBackButton>
        <div className="pt-8">
            <LoginPrompt 
                icon={History} 
                title="Check Your Match History" 
                description="Sign in to review your past performances, analyze your stats, and track your progress." 
            />
        </div>
      </PageWrapper>
    );
  }
    
  return (
    <PageWrapper title="My Innings" showBackButton>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="recent">Recent</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="perfect">Perfect Scores</TabsTrigger>
          </TabsList>
          
          <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
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
      </Tabs>
    </PageWrapper>
  );
}
