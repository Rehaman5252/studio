
'use client';

import React from 'react';
import AdaptiveDynamicPage, { DynamicCard } from '@/components/common/AdaptiveDynamicPage';

// Declarative array of cards for this page
const cards: DynamicCard[] = [
  {
    title: 'Header',
    importPath: '@/components/profile/ProfileHeader',
    name: 'ProfileHeader',
    skeletonProps: { height: 100 }, // optional per-card override
  },
  {
    title: 'Completion',
    importPath: '@/components/profile/ProfileCompletion',
    name: 'ProfileCompletion',
  },
  {
    title: 'Stats',
    importPath: '@/components/profile/ProfileStats',
    name: 'ProfileStats',
    skeletonProps: { height: 180 }, // optional per-card override
  },
  {
    title: 'Referral',
    importPath: '@/components/profile/ReferralCard',
    name: 'ReferralCard',
  },
];

// Optional per-page default Skeleton heights
const pageDefaultHeights = {
  ProfileHeader: 110,
  ProfileStats: 170,
};

export default function SampleProfilePage() {
  return <AdaptiveDynamicPage cards={cards} defaultHeights={pageDefaultHeights} />;
}
