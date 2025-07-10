
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProfileSkeleton() {
    return (
        <div className="space-y-6">
            <Card className="bg-card shadow-lg">
                <CardContent className="p-4 flex items-center gap-4">
                    <Skeleton className="w-20 h-20 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-7 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-[96px] w-full" />
            <Card className="bg-card shadow-lg">
                <CardContent className="p-4 grid grid-cols-3 gap-4">
                    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-8 mt-1" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-8 mt-1" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg">
                        <Skeleton className="h-7 w-7 rounded-full" />
                        <Skeleton className="h-7 w-8 mt-1" />
                        <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                </CardContent>
            </Card>
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
        </div>
    );
}
