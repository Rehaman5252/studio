
"use client";

import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import React from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


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
