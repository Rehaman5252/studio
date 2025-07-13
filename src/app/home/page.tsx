
'use client';

import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import HomeClientContent from '@/components/home/HomeClientContent';


function HomePage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Wait until loading is false before checking user
        if (!loading && user === null) {
            router.replace('/auth/login');
        }
    }, [user, loading, router]);

    // Show a global loader while auth state is being determined
    if (loading || !user) {
      return (
         <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="flex flex-col h-screen bg-background text-foreground">
        <header className="p-4 flex items-center justify-center">
          <div className="text-center">
              <h1 className="text-5xl font-extrabold tracking-tight text-shimmer animate-shimmer">
                CricBlitz
              </h1>
              <p className="text-sm text-muted-foreground">The Ultimate Cricket Quiz</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto px-4 py-8">
            <HomeClientContent />
          </div>
        </main>
      </div>
    );
}

export default HomePage;
