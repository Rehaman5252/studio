
"use client";

import PageWrapper from "@/components/PageWrapper";
import RewardsContent from "@/components/rewards/RewardsContent";
import GenericOffers from "@/components/rewards/GenericOffers";
import { useAuth } from "@/context/AuthProvider";
import LoginPrompt from "@/components/auth/LoginPrompt";
import { Gift } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function RewardsPage() {
  const { user, loading } = useAuth();

  return (
    <PageWrapper title="Rewards">
      {loading ? (
        <div className="space-y-8">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
        </div>
      ) : user ? (
        <RewardsContent />
      ) : (
        <div className="pt-8">
          <LoginPrompt 
            icon={Gift}
            title="Unlock Your Kit Bag"
            description="Sign in to view your match rewards and scratch cards. Every game you play earns you a prize!"
          />
        </div>
      )}
      <div className="mt-8">
        <GenericOffers />
      </div>
    </PageWrapper>
  );
}
