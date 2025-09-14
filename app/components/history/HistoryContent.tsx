
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '../auth/LoginPrompt';
import { History, BarChart, Trophy } from 'lucide-react';

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

const HistorySkeleton = ({ count = 3 }: { count?: number}) => (
    <div className="space-y-4 pt-4">
        {Array.from({ length: count }).map((_, i) => (
             <Skeleton key={i} className="h-24 w-full" />
        ))}
    </div>
);

const LoggedOutView = ({ icon, title, description }: { icon: React.ComponentType<any>, title: string, description: string }) => (
    <div className="pt-8">
        <LoginPrompt 
            icon={icon} 
            title={title} 
            description={description} 
        />
    </div>
);

export default function HistoryContent() {
  const [activeTab, setActiveTab] = useState('recent');
  const { user, loading } = useAuth();
  
  if (loading) {
      return (
        <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <HistorySkeleton />
        </div>
      );
  }

  return (
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
              <TabsContent value="recent" forceMount={true}>
                  {user ? <RecentHistory /> : <LoggedOutView icon={History} title="Review Your Recent Form" description="Just finished a match? Sign in to see your last few innings and analyze your performance." />}
              </TabsContent>
              <TabsContent value="all" forceMount={true}>
                  {user ? <AllHistory /> : <LoggedOutView icon={BarChart} title="Access Your Career Stats" description="Every match counts. Sign in to view your complete match history and track long-term progress." />}
              </TabsContent>
              <TabsContent value="perfect" forceMount={true}>
                  {user ? <PerfectScoresHistory /> : <LoggedOutView icon={Trophy} title="View Your Honours Board" description="Did you score a century? Sign in to see your perfect scores and claim your winner certificates." />}
              </TabsContent>
          </motion.div>
      </Tabs>
  )
}
