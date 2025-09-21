
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Default Skeleton heights per component name
const defaultSkeletonHeights: Record<string, number> = {
  ProfileHeader: 80,
  ProfileCompletion: 128,
  ProfileStats: 160,
  ReferralCard: 96,
};

// Fully adaptive dynamic import helper with optional skeletonProps
const loadWithSkeleton = (
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

// Declarative array of profile cards
const profileCards = [
  { title: 'Header', importPath: '@/components/profile/ProfileHeader', name: 'ProfileHeader' },
  { title: 'Completion', importPath: '@/components/profile/ProfileCompletion', name: 'ProfileCompletion' },
  { title: 'Stats', importPath: '@/components/profile/ProfileStats', name: 'ProfileStats' },
  { title: 'Referral', importPath: '@/components/profile/ReferralCard', name: 'ReferralCard' },
];

// Generate dynamic components from declarative array
const cardsWithComponents = profileCards.map(({ title, importPath, name }) => ({
  title,
  Component: loadWithSkeleton(
    () =>
      import(`${importPath}`).catch((err) => {
        console.error(`Failed to load component "${name}" from ${importPath}:`, err);
        // Fallback component if import fails
        return { default: () => <Skeleton className={`h-[${defaultSkeletonHeights[name] || 100}px] w-full`} /> };
      }),
    name
  ),
}));

export default function ProfilePageContent() {
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
