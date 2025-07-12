
'use client';

import React, { Suspense } from 'react';
import type { CubeBrand } from '@/components/home/brandData';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';
import dynamic from 'next/dynamic';
import GlobalStats from './GlobalStats';

const Cube = dynamic(() => import('@/components/Cube'), {
    ssr: false,
    loading: () => <Skeleton className="h-64 md:h-80 w-full" />,
});

export default function QuizSelector() {
  const { user } = useAuth();
  const router = useRouter();

  const handleStartQuiz = (selectedBrand: CubeBrand) => {
    if (!user) {
        router.push('/auth/login');
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }
  };
  
  return (
    <div className="animate-fade-in-up">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
            <p className="text-sm text-muted-foreground">Click a cube face to start the quiz!</p>
        </div>
        
        <div className="h-64 md:h-80 w-full cursor-pointer">
          <Suspense fallback={<Skeleton className="h-64 md:h-80 w-full" />}>
            <Cube onFaceClick={handleStartQuiz} />
          </Suspense>
        </div>

        <div className="mt-8 space-y-8">
            <GlobalStats />
        </div>
    </div>
  );
}
