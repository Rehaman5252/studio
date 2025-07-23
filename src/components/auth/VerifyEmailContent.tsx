
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from');

    return (
        <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-extrabold">Check Your Email</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">One last step to secure your account.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p className="text-muted-foreground">
                We've sent a verification link to your email. Please click the link to complete your registration.
                <br />
                <strong className='text-foreground'>Remember to check your spam folder.</strong>
            </p>
            <Button asChild size="lg" className="mt-4">
            <Link href={`/auth/login${from ? `?from=${encodeURIComponent(from)}` : ''}`}>
                Go to Login
            </Link>
            </Button>
        </CardContent>
        </Card>
    );
}
