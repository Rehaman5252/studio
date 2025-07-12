
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import QuizSelector from '@/components/home/QuizSelector';
import GlobalStats from '@/components/home/GlobalStats';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import type { CubeBrand } from '@/components/home/brandData';


export default function HomeWrapper() {
  const user = useAuth();
  const router = useRouter();

  const handleStartQuiz = (selectedBrand: CubeBrand) => {
    if (!user) {
        router.push('/auth/login');
    } else {
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    }
  };

  if (!user) {
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
