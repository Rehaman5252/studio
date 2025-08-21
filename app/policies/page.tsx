
'use client';

import React from 'react';
import Policies from '@/components/profile/Policies';
import PageWrapper from '@/components/PageWrapper';

export default function PoliciesPage() {
  return (
    <PageWrapper title="Legal & Policies" showBackButton>
        <Policies />
    </PageWrapper>
  );
}
