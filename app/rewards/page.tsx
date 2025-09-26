
"use client";

import PageWrapper from "@/components/PageWrapper";
import AuthGuard from "@/components/auth/AuthGuard";
import RewardsContent from "@/components/rewards/RewardsContent";
import GenericOffers from "@/components/rewards/GenericOffers";

export default function RewardsPage() {
  return (
    <PageWrapper title="Rewards">
      <AuthGuard>
        <RewardsContent />
        <GenericOffers />
      </AuthGuard>
    </PageWrapper>
  );
}

