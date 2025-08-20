
'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { History, ServerCrash, WifiOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import RecentHistory from '@/components/history/RecentHistory';
import AllHistory from '@/components/history/AllHistory';
import PerfectScoresHistory from '@/components/history/PerfectScoresHistory';

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
  
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>
       <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {loading ? <HistorySkeleton /> : !user ? (
            <div className="pt-8">
                <LoginPrompt 
                    icon={History}
                    title="View Your Quiz History"
                    description="Sign in to see all your past quiz attempts and review your performance."
                />
            </div>
        ) : (
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
        )}
      </main>
    </div>
  );
}
