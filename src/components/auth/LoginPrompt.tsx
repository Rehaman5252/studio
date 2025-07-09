'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { LucideIcon } from 'lucide-react';

interface LoginPromptProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function LoginPrompt({ icon: Icon, title, description }: LoginPromptProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center">
            <Card className="w-full max-w-md bg-card/80 shadow-lg border-primary/20">
                <CardHeader>
                    <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                        <Icon className="h-12 w-12 text-primary" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{title}</CardTitle>
                    <CardDescription className="text-muted-foreground mt-2">{description}</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4 p-6 pt-4">
                    <Button asChild size="lg" className="flex-1">
                        <Link href="/auth/login">Login</Link>
                    </Button>
                    <Button asChild size="lg" variant="secondary" className="flex-1">
                        <Link href="/auth/signup">Sign Up</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
