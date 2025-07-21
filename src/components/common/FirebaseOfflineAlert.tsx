'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';

const FirebaseOfflineAlert = () => {
  return (
    <Alert variant="destructive" className="mt-4">
        <WifiOff className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          We're having trouble connecting to our servers. Please check your internet connection or refresh the page.
        </AlertDescription>
    </Alert>
  );
};

export default FirebaseOfflineAlert;
