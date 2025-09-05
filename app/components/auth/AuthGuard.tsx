
'use client';

import { useAuth } from '@/context/AuthProvider';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import LoginPrompt from './LoginPrompt';
import { LucideIcon } from 'lucide-react';

interface AuthGuardProps {
  children: ReactNode;
  loadingSkeleton: ReactNode;
  loginPrompt: {
    icon: LucideIcon;
    title: string;
    description: string;
  };
}

const FullPageSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-[60px] w-full" />
      <Skeleton className="h-[60px] w-full" />
      <Skeleton className="h-[60px] w-full" />
    </div>
);


export default function AuthGuard({ children, loadingSkeleton, loginPrompt }: AuthGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return loadingSkeleton;
  }

  if (!user) {
    return (
        <div className="pt-8">
            <LoginPrompt {...loginPrompt} />
        </div>
    );
  }

  return <>{children}</>;
}
