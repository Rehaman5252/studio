
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import the main client-side component to prevent its hooks and context
// from being part of the initial server-side render, which is a common cause of build failures.
const HomePageClient = dynamic(() => import('@/components/home/HomePageClient'), {
  ssr: false,
  loading: () => <HomeContentSkeleton />,
});

const HomeContentSkeleton = () => (
  <div className="space-y-8 animate-pulse">
    <div className="text-center mb-4">
      <Skeleton className="h-8 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
    </div>
    <div className="flex justify-center items-center h-[200px]">
      <Skeleton className="w-48 h-48 rounded-lg" />
    </div>
    <Skeleton className="h-[124px] w-full rounded-2xl" />
    <div className="grid grid-cols-2 gap-4">
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
    </div>
    <Skeleton className="h-16 w-full rounded-full" />
  </div>
);

export default function HomePage() {
  const headerContent = (
    <div className="text-center">
      <h1 className="text-7xl font-extrabold tracking-tighter animate-shimmer">
        indcric
      </h1>
      <p className="mt-1 text-base font-normal text-foreground/80">
        The Ultimate Cricket Quiz Challenge!
      </p>
    </div>
  );

  return (
    <PageWrapper title={headerContent} hideBorder>
      <HomePageClient />
    </PageWrapper>
  );
}
