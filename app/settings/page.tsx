
'use client';

import React from 'react';
import SettingsContent from '@/components/profile/SettingsContent';
import PageWrapper from '@/components/PageWrapper';

export default function SettingsPage() {
  return (
    <PageWrapper title="App Settings" showBackButton>
        <SettingsContent />
    </PageWrapper>
  );
}
