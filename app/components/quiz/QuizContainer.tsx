
"use client";

import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const Alert = dynamic(() => import("@/components/ui/alert").then(m => m.Alert), {
  ssr: false,
  loading: () => <Skeleton className="h-12 w-full" />,
});

export default function QuizContainer() {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="p-6">
          <Suspense fallback={<Skeleton className="h-12 w-full" />}>
            <Alert>Quiz is loading, please wait...</Alert>
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
