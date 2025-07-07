'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function FirebaseConfigWarning() {
  return (
    <div className="space-y-4">
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle className="font-bold">Connection Error: Firebase Not Configured</AlertTitle>
            <AlertDescription>
                <p>The application cannot connect to its backend services.</p>
                <p className="mt-2 font-semibold">To fix this, you must add your `NEXT_PUBLIC_FIREBASE_*` credentials to your hosting provider's environment variable settings.</p>
                <p className="mt-2 text-xs text-muted-foreground">This is not a bug in the code. The authentication forms have been hidden and will appear here automatically once the connection is established.</p>
            </AlertDescription>
        </Alert>
    </div>
  );
}
