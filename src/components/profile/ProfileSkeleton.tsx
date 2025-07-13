
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Award, Edit, Gift, LogOut, Mail, MessageSquare, Settings, Users } from 'lucide-react';

export default function ProfileSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="relative">
                 <Card className="bg-card shadow-lg">
                    <CardContent className="p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
                        <Skeleton className="w-20 h-20 rounded-full" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-32" />
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-56" />
                        </div>
                    </CardContent>
                </Card>
                <div className="absolute top-4 right-4 rounded-full h-8 w-8 bg-muted border flex items-center justify-center">
                    <Edit className="h-4 w-4 text-muted-foreground" />
                </div>
            </div>

            {/* Stats Summary Skeleton */}
            <Card className="bg-card shadow-lg">
                <CardContent className="p-4 grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-8 mt-1" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-8 mt-1" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-8 mt-1" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                </CardContent>
            </Card>

            {/* Referral Card Skeleton */}
            <Card className="bg-card shadow-lg">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Users className="h-8 w-8 text-primary"/>
                            <div>
                                <Skeleton className="h-7 w-16" />
                                <Skeleton className="h-4 w-24 mt-1" />
                            </div>
                        </div>
                        <Skeleton className="h-9 w-28 rounded-md" />
                    </div>
                </CardContent>
            </Card>
            
            {/* Links Skeleton */}
            <section className="space-y-3 pt-4">
                <div className="flex items-center gap-4 bg-secondary h-[56px] w-full rounded-lg px-4">
                    <Gift className="text-secondary-foreground" />
                    <Skeleton className="h-5 w-32 bg-secondary-foreground/20" />
                </div>
                 <div className="flex items-center gap-4 bg-secondary h-[56px] w-full rounded-lg px-4">
                    <Award className="text-secondary-foreground" />
                    <Skeleton className="h-5 w-40 bg-secondary-foreground/20" />
                </div>
                 <div className="flex items-center gap-4 bg-secondary h-[56px] w-full rounded-lg px-4">
                    <Settings className="text-secondary-foreground" />
                    <Skeleton className="h-5 w-36 bg-secondary-foreground/20" />
                </div>
            </section>

            {/* Support Skeleton */}
             <Card className="bg-card shadow-lg">
                <CardContent className="p-6 space-y-3">
                    <div className="flex items-center gap-4 bg-secondary h-[56px] w-full rounded-lg px-4">
                        <Mail className="text-secondary-foreground" />
                        <Skeleton className="h-5 w-48 bg-secondary-foreground/20" />
                    </div>
                    <div className="flex items-center gap-4 bg-secondary h-[56px] w-full rounded-lg px-4">
                        <MessageSquare className="text-secondary-foreground" />
                        <Skeleton className="h-5 w-44 bg-secondary-foreground/20" />
                    </div>
                </CardContent>
            </Card>

            {/* Logout Skeleton */}
            <div className="flex items-center justify-center gap-2 bg-destructive h-[44px] w-full rounded-lg px-4">
                <LogOut className="text-destructive-foreground" />
                <Skeleton className="h-5 w-20 bg-destructive-foreground/20" />
            </div>

        </div>
    );
}
