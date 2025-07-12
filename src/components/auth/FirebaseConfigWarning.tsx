
'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function FirebaseConfigWarning() {
  return (
    <div className="space-y-4">
        <Alert variant="destructive">
            <Terminal className="h-4 w-4" />
            <AlertTitle className="text-lg font-extrabold">🔴 Action Required: Connect to Firebase</AlertTitle>
            <AlertDescription className="space-y-3 mt-2">
                <p>The application is not connected to a Firebase backend. This is not a code error—it's a final configuration step.</p>
                <div>
                    <p className="font-semibold">To fix this, you must add your Firebase web app credentials to your Environment Variables.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        In a real deployment, these would be in your hosting provider's settings (e.g., Firebase App Hosting, Vercel). For local development, they go in a `.env.local` file.
                    </p>
                </div>
                <p className="text-sm">
                   Ensure all `NEXT_PUBLIC_FIREBASE_*` variables are set. You can find these in your Firebase project settings.
                </p>
            </AlertDescription>
        </Alert>
    </div>
  );
}
