
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const LoadingFallback = ({ type = 'spinner', message = "Loading..." }: { type?: 'spinner' | 'skeleton', message?: string }) => {
  if (type === 'skeleton') {
    return (
      <div className="space-y-4 pt-4">
        {[...Array(3)].map((_, i) => (
            <CardSkeleton key={i} />
        ))}
      </div>
    )
  }
  
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

const CardSkeleton = () => (
    <div className="p-4 rounded-lg border bg-card">
        <div className="flex justify-between items-center mb-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-5 w-1/4" />
        </div>
        <Skeleton className="h-4 w-1/3 mb-4" />
        <div className="flex justify-between items-end">
            <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
            </div>
            <Skeleton className="h-9 w-28" />
        </div>
    </div>
)

export default LoadingFallback;
