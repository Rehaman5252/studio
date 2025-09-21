
'use client';

import React from 'react';
import AdaptiveDynamicPage from '@/components/common/AdaptiveDynamicPage';
import { pagesConfig } from '@/app/config/pagesConfig';
import { usePathname } from 'next/navigation';
import PageWrapper from '@/components/PageWrapper';

// This component now acts as a generic loader for any page defined in pagesConfig.
export default function DynamicPageLoader() {
  const pathname = usePathname();
  const pageConfig = pagesConfig.find((p) => p.path === pathname);

  if (!pageConfig) {
    return (
      <PageWrapper title="Page Not Found">
          <div>The configuration for this page could not be found.</div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title={pageConfig.title}>
        <AdaptiveDynamicPage cards={pageConfig.cards} defaultHeights={pageConfig.defaultHeights} />
    </PageWrapper>
  );
}
