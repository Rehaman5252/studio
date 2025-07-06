
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MailCheck } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const from = searchParams.get('from');

    return (
        <Card className="w-full max-w-md text-center">
        <CardHeader>
            <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                <MailCheck className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-extrabold">Almost There!</CardTitle>
            <CardDescription className="text-lg text-muted-foreground">Verify Your Email</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <p>We've sent a verification link to your email address.</p>
            <p className="text-muted-foreground">Please click the link in the email to activate your account. You can close this tab.</p>
            <Button asChild size="lg" className="mt-4">
            <Link href="/auth/login">
                Go to Login
            </Link>
            </Button>
        </CardContent>
        </Card>
    );
}
