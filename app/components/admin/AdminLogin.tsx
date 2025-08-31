'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AdminLogin() {
  return (
    <Card className="shadow-2xl bg-card/80 backdrop-blur-lg border-primary/20 animate-fade-in-up">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Third Umpire's Room</CardTitle>
            <CardDescription>Access restricted to authorized match officials.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Official Email</Label>
                    <Input id="email" type="email" placeholder="umpire@indcric.app" required className="h-12" />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Access Code</Label>
                    <Input id="password" type="password" required className="h-12" />
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold">
                    Proceed to Review
                </Button>
                <div className="text-center">
                    <Button variant="link" asChild className="text-xs text-muted-foreground">
                        <Link href="/">
                            Return to the Pitch
                        </Link>
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
