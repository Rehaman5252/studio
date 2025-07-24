
'use client';

import React from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { WifiOff } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';

const FirebaseOfflineAlert = () => {
  const { isOffline } = useAuth();

  if (!isOffline) {
    return null;
  }

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[200] p-4 animate-fade-in-up"
    >
      <Alert variant="destructive" className="max-w-xl mx-auto shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>You Appear to Be Offline</AlertTitle>
          <AlertDescription>
            We're having trouble connecting to our servers. Some features may be unavailable until you reconnect.
          </AlertDescription>
      </Alert>
    </div>
  );
};

export default FirebaseOfflineAlert;
