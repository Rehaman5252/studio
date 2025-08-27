
'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import PageWrapper from '@/components/PageWrapper';
import { useAuth } from '@/context/AuthProvider';
import { Edit } from 'lucide-react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const LoginPrompt = dynamic(() => import('@/components/auth/LoginPrompt'), { loading: () => <Skeleton className="h-56 w-full" />});
const ContributionStats = dynamic(() => import('@/components/profile/ContributionStats'), { loading: () => <Skeleton className="h-48 w-full" />});
const UserSubmissionsList = dynamic(() => import('@/components/profile/UserSubmissionsList'), { loading: () => <Skeleton className="h-32 w-full" />});
const FactForm = dynamic(() => import('@/components/profile/FactForm'), { loading: () => <Skeleton className="h-48 w-full" />});
const PostForm = dynamic(() => import('@/components/profile/PostForm'), { loading: () => <Skeleton className="h-64 w-full" />});
const QuestionForm = dynamic(() => import('@/components/profile/QuestionForm'), { loading: () => <Skeleton className="h-96 w-full" />});


const LoadingSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-48 w-full" />
    </div>
);

export default function ContributePage() {
    const [activeTab, setActiveTab] = useState('stats');
    const { user, loading } = useAuth();
    
    if (loading) {
        return (
            <PageWrapper title="Commentary Box" showBackButton>
                <LoadingSkeleton />
            </PageWrapper>
        );
    }

    if (!user) {
        return (
            <PageWrapper title="Commentary Box" showBackButton>
                <div className="w-full pt-8">
                    <LoginPrompt
                        icon={Edit}
                        title="Join the Commentary Team"
                        description="Sign in to contribute your cricket knowledge and earn rewards."
                    />
                </div>
            </PageWrapper>
        );
    }


    return (
        <PageWrapper title="Commentary Box" showBackButton>
            <Card className="bg-card shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg">Contribute & Earn</CardTitle>
                    <CardDescription>
                        Contribute to the indcric community and earn rewards! Submit facts, posts, or questions.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="stats">Your Scorecard</TabsTrigger>
                            <TabsTrigger value="fact">Add Fact</TabsTrigger>
                            <TabsTrigger value="post">Add Post</TabsTrigger>
                            <TabsTrigger value="question">Add Question</TabsTrigger>
                        </TabsList>
                        
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4"
                        >
                            <TabsContent value="stats" forceMount={activeTab === 'stats'}>
                            <ContributionStats />
                            <UserSubmissionsList />
                            </TabsContent>
                            <TabsContent value="fact" forceMount={activeTab === 'fact'}>
                                <FactForm onSubmitted={() => setActiveTab('stats')} />
                            </TabsContent>
                            <TabsContent value="post" forceMount={activeTab === 'post'}>
                                <PostForm onSubmitted={() => setActiveTab('stats')} />
                            </TabsContent>
                            <TabsContent value="question" forceMount={activeTab === 'question'}>
                                <QuestionForm onSubmitted={() => setActiveTab('stats')} />
                            </TabsContent>
                        </motion.div>
                    </Tabs>
                </CardContent>
            </Card>
        </PageWrapper>
    );
}
