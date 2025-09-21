
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Default Skeleton heights per component name (can be customized per page)
const defaultSkeletonHeights: Record<string, number> = {};

// Fully adaptive dynamic import helper with optional skeletonProps
export const loadWithSkeleton = (
  importFunc: () => Promise<{ default: React.ComponentType<any> }>,
  name: string,
  skeletonProps?: { height?: number; className?: string }
) =>
  dynamic(importFunc, {
    loading: () => {
      const height = skeletonProps?.height || defaultSkeletonHeights[name] || 100;
      const className = skeletonProps?.className || '';
      return <Skeleton className={`h-[${height}px] w-full ${className}`} />;
    },
    ssr: false,
  });

// Generic page component that takes a declarative array of cards
export interface DynamicCard {
  title: string;
  importPath: string;
  name: string;
  skeletonProps?: { height?: number; className?: string };
}

interface AdaptiveDynamicPageProps {
  cards: DynamicCard[];
}

export default function AdaptiveDynamicPage({ cards }: AdaptiveDynamicPageProps) {
  // Generate dynamic components safely
  const cardsWithComponents = cards.map(({ title, importPath, name, skeletonProps }) => ({
    title,
    Component: loadWithSkeleton(
      () =>
        import(`${importPath}`).catch((err) => {
          console.error(`Failed to load component "${name}" from ${importPath}:`, err);
          const height = skeletonProps?.height || defaultSkeletonHeights[name] || 100;
          const className = skeletonProps?.className || '';
          return { default: () => <Skeleton className={`h-[${height}px] w-full ${className}`} /> };
        }),
      name,
      skeletonProps
    ),
  }));

  return (
    <div className="space-y-6">
      {cardsWithComponents.map(({ title, Component }) => (
        <Card key={title}>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Component />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
