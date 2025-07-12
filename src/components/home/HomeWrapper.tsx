
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import GlobalStats from '@/components/home/GlobalStats';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import type { CubeBrand } from '@/components/home/brandData';
import { Skeleton } from '@/components/ui/skeleton';


const QuizSelector = dynamic(() => import('@/components/home/QuizSelector'), {
  ssr: false,
  loading: () => <Skeleton className="h-64 md:h-80 w-full" />,
});


export default function HomeWrapper() {
  const { user, loading: isAuthLoading } = useAuth();
  const router = useRouter();

  const handleStartQuiz = (selectedBrand: CubeBrand) => {
    if (!user) {
        router.push('/auth/login');
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }
  };

  if (isAuthLoading) {
      return (
        <div className="flex flex-col flex-1 items-center justify-center py-10">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }
  
  return (
    <>
        <div className="animate-fade-in-up">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Click a cube face to start the quiz!</p>
            </div>
            
            <QuizSelector 
                onFaceClick={handleStartQuiz}
            />

            <div className="mt-8 space-y-8">
                <GlobalStats />
            </div>
        </div>
    </>
  );
}
