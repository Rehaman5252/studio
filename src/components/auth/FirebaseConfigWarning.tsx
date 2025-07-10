
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
                <p>The live application is not connected to your Firebase backend. This is not a code error—it's a final configuration step.</p>
                <div>
                    <p className="font-semibold">To fix this, you must add your Firebase credentials to your hosting provider's "Environment Variables" settings.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        (Your hosting provider is where your live website is deployed, for example, <strong>Firebase App Hosting</strong>, Vercel, or Netlify. It is not the Firebase Console itself.)
                    </p>
                </div>
                <p className="text-sm">
                   Copy the `NEXT_PUBLIC_FIREBASE_*` variables from your local `.env` file and paste them into your hosting provider's settings to make authentication work.
                </p>
            </AlertDescription>
        </Alert>
    </div>
  );
}
