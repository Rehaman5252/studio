
"use client";

import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";

const Alert = dynamic(() => import("@/components/ui/alert").then(m => m.Alert), {
  ssr: false,
  loading: () => <Skeleton className="h-12 w-full" />,
});
const AlertTitle = dynamic(() => import("@/components/ui/alert").then(m => m.AlertTitle), { ssr: false });
const AlertDescription = dynamic(() => import("@/components/ui/alert").then(m => m.AlertDescription), { ssr: false });


const QuizContainer = () => {
  return (
    <div className="p-4">
      <Card>
        <CardContent className="p-6">
            <Alert>
                <AlertTitle>Loading Quiz</AlertTitle>
                <AlertDescription>The quiz is being prepared. Please wait a moment.</AlertDescription>
            </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default QuizContainer;
    