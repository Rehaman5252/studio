
'use client';

import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
  variant?: 'default' | 'destructive';
}

export const EmptyState = ({ Icon, title, description, variant = 'default' }: EmptyStateProps) => {
  return (
    <Alert variant={variant} className="text-center justify-center flex flex-col items-center p-8 bg-card/50">
      <Icon className="h-12 w-12 mb-4 text-muted-foreground" />
      <AlertTitle className="text-lg font-semibold">{title}</AlertTitle>
      <AlertDescription>
        {description}
      </AlertDescription>
    </Alert>
  );
};
