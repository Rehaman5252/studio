
"use client";

import PageWrapper from "@/components/PageWrapper";
import RewardsContent from "@/app/components/rewards/RewardsContent";
import GenericOffers from "@/app/components/rewards/GenericOffers";
import { useAuth } from "@/context/AuthProvider";
import LoginPrompt from "@/app/components/auth/LoginPrompt";
import { Gift } from "lucide-react";
import ClientOnly from "@/components/ClientOnly";
import LoadingSpinner from "@/app/components/ui/LoadingSpinner";

export default function RewardsPage() {
  const { user, loading } = useAuth();

  return (
    <PageWrapper title="Rewards">
      <ClientOnly>
        {loading ? (
          <LoadingSpinner className="h-48"/>
        ) : user ? (
          <>
            <RewardsContent />
            <GenericOffers />
          </>
        ) : (
          <div className="pt-8">
            <LoginPrompt 
              icon={Gift}
              title="Step Up to the Crease to See Your Rewards"
              description="Sign in to view your match rewards and scratch cards. Every game you play earns you a prize!"
            />
          </div>
        )}
      </ClientOnly>
    </PageWrapper>
  );
}
