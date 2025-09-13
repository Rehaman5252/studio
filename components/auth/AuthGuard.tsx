
"use client";

import { ReactNode } from "react";
import { useFirebase } from "@/providers/FirebaseProvider";
import { redirect } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useFirebase();

  if (loading) {
    return (
      <div className="flex flex-col gap-4 p-6">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    redirect("/auth/login");
  }

  return <>{children}</>;
}
