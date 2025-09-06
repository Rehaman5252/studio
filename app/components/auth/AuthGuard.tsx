"use client";

import React, { useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: React.ReactNode;
  loadingSkeleton?: React.ReactNode;
  loginPrompt?: React.ReactNode;
}

export default function AuthGuard({ children, loadingSkeleton }: AuthGuardProps) {
  const [user, loading] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return loadingSkeleton || (
      <div className="flex justify-center items-center min-h-screen">
        <Skeleton className="h-10 w-32" />
      </div>
    );
  }

  if (!user) {
    return null; // or a login prompt
  }

  return <>{children}</>;
}
