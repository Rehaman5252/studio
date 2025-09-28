
'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export default function LoadingSpinner({ className, size = 24 }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex justify-center items-center p-8', className)}>
      <Loader2 style={{ width: size, height: size }} className="animate-spin text-primary" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
