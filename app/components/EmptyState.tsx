
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  Icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState = ({ Icon, title, description }: EmptyStateProps) => (
  <Card className="bg-card/80">
    <CardContent className="p-8 text-center text-muted-foreground">
      <Icon className="h-12 w-12 mx-auto mb-4 text-primary/50" />
      <p className="font-semibold text-lg text-foreground">{title}</p>
      <p>{description}</p>
    </CardContent>
  </Card>
);
