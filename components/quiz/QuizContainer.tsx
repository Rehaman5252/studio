
"use client";

import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import React from 'react';
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
            <Alert>Quiz is loading, please wait...</Alert>
        </CardContent>
      </Card>
    </div>
  );
}
