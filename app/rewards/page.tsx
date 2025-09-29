
"use client";

import PageWrapper from "@/components/PageWrapper";
import RewardsContent from "@/components/rewards/RewardsContent";
import GenericOffers from "@/components/rewards/GenericOffers";
import ClientOnly from "@/components/ClientOnly";

export default function RewardsPage() {
  return (
    <PageWrapper title="Rewards">
      <ClientOnly>
        <RewardsContent />
        <GenericOffers />
      </ClientOnly>
    </PageWrapper>
  );
}
