
'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthProvider';
import { cn } from '@/lib/utils';
import LoginPrompt from '../auth/LoginPrompt';
import { Users } from 'lucide-react';
import LiveLeaderboard from './LiveLeaderboard';
import AllTimeLeaderboard from './AllTimeLeaderboard';
import MyNetworkLeaderboard from './MyNetworkLeaderboard';

export default function LeaderboardContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('live');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={cn("grid w-full grid-cols-3")}>
            <TabsTrigger value="live">Current</TabsTrigger>
            <TabsTrigger value="all-time">All-Time</TabsTrigger>
            <TabsTrigger value="network">My Network</TabsTrigger>
        </TabsList>

        <TabsContent value="live">
          <LiveLeaderboard />
        </TabsContent>

        <TabsContent value="all-time">
          <AllTimeLeaderboard />
        </TabsContent>
        
        <TabsContent value="network">
          {user ? (
            <MyNetworkLeaderboard />
          ) : (
            <div className="pt-8">
              <LoginPrompt 
                icon={Users}
                title="View Your Network's Stats"
                description="Pad up and sign in to see your squad's performance and track your referral rewards."
              />
            </div>
          )}
        </TabsContent>
    </Tabs>
  );
}
