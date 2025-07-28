
"use client";

import { Suspense } from 'react';

const ResultsPageContent = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen text-xl font-bold">
          ✅ Quiz Complete! Score: 4/5
        </div>
      );
}


export default function ResultsPage() {
    return (
        <Suspense fallback={<div>Loading results...</div>}>
            <ResultsPageContent />
        </Suspense>
    )
}
