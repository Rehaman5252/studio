
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollText } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';
import QuizHistoryContent from '@/components/quiz-history/QuizHistoryContent';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';

const HistorySkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full max-w-md mx-auto" />
      <div className="space-y-4 pt-4">
        <Skeleton className="h-[148px] w-full" />
        <Skeleton className="h-[148px] w-full" />
        <Skeleton className="h-[148px] w-full" />
      </div>
    </div>
);

async function QuizHistoryData() {
  const { user } = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
          <LoginPrompt
            icon={ScrollText}
            title="Track Your Innings"
            description="Log in to see your quiz performance, stats, and AI analysis."
          />
      </div>
    );
  }
  
  return <QuizHistoryContent />;
}

export default function QuizHistoryPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Quiz History</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
        <Suspense fallback={<HistorySkeleton />}>
            <QuizHistoryData />
        </Suspense>
      </main>
    </div>
  );
}
