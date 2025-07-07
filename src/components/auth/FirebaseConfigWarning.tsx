
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function FirebaseConfigWarning() {
  return (
    <div className="space-y-4">
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle className="text-lg font-extrabold">🔴 Action Required: Connect to Firebase</AlertTitle>
            <AlertDescription className="space-y-2 mt-2">
                <p>The live application is not connected to your Firebase backend. This is not a code error.</p>
                <p className="font-semibold">To fix this, you must copy your `NEXT_PUBLIC_FIREBASE_*` variables from your local `.env` file into your hosting provider's "Environment Variables" settings.</p>
                <p className="mt-2 text-xs text-muted-foreground">This is a required step for any deployed web application. The login forms will appear here automatically once the connection is made.</p>
            </AlertDescription>
        </Alert>
    </div>
  );
}
