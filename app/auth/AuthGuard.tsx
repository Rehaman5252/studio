
'use client';

import { ReactNode } from "react";
import { useFirebase } from "@/providers/FirebaseProvider";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

interface AuthGuardProps {
  children: ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useFirebase();
  const router = useRouter();
  const pathname = usePathname();

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
    // Redirect to login page, preserving the intended destination
    const from = pathname;
    router.replace(`/auth/login?from=${from}`);
    return null; // Return null to prevent rendering children while redirecting
  }

  return <>{children}</>;
}
