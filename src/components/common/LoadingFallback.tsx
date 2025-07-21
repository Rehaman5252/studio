
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="text-sm">{message}</p>
    </div>
  );
};

export default LoadingFallback;
