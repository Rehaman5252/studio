
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Frown, Home } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md text-center shadow-lg animate-fade-in-up">
        <CardHeader>
          <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4">
            <Frown className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-4xl font-extrabold text-destructive">404 - Page Not Found</CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            It seems you've been stumped! The page you're looking for isn't here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-6">
            Let's get you back to the pitch.
          </p>
          <Button asChild size="lg">
            <Link href="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
