
// Centralized configuration for all dynamic pages
import type { DynamicCard } from '@/components/common/AdaptiveDynamicPage';

export interface PageConfig {
  path: string; // route path
  title?: string; // optional page title
  cards: DynamicCard[]; // array of dynamic cards
  defaultHeights?: Record<string, number>; // optional per-page Skeleton heights
}

// Example configuration for multiple pages
export const pagesConfig: PageConfig[] = [
  {
    path: '/sample-profile',
    title: 'User Profile',
    defaultHeights: {
      ProfileHeader: 110,
      ProfileStats: 170,
    },
    cards: [
      { title: 'Header', importPath: '@/components/profile/ProfileHeader', name: 'ProfileHeader', skeletonProps: { height: 100 } },
      { title: 'Completion', importPath: '@/components/profile/ProfileCompletion', name: 'ProfileCompletion' },
      { title: 'Stats', importPath: '@/components/profile/ProfileStats', name: 'ProfileStats', skeletonProps: { height: 180 } },
      { title: 'Referral', importPath: '@/components/profile/ReferralCard', name: 'ReferralCard' },
    ],
  },
  // {
  //   path: '/dashboard',
  //   title: 'Dashboard',
  //   defaultHeights: {
  //     DashboardStats: 150,
  //     DashboardSummary: 120,
  //   },
  //   cards: [
  //     { title: 'Stats', importPath: '@/components/dashboard/DashboardStats', name: 'DashboardStats' },
  //     { title: 'Summary', importPath: '@/components/dashboard/DashboardSummary', name: 'DashboardSummary', skeletonProps: { height: 140 } },
  //   ],
  // },
  // Add more pages here by just extending this array
];
