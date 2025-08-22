
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';
import ContributionStats from './ContributionStats';
import UserSubmissionsList from './UserSubmissionsList';
import FactForm from './FactForm';
import PostForm from './PostForm';
import QuestionForm from './QuestionForm';

export default function CommentarySection() {
    const [activeTab, setActiveTab] = useState('stats');

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Commentary Box</CardTitle>
                <CardDescription>
                    Contribute to the CricBlitz community and earn rewards! Submit facts, posts, or questions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="stats">Stats</TabsTrigger>
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
    );
}
