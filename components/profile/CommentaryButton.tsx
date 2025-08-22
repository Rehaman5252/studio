
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit, ChevronRight } from 'lucide-react';


export default function CommentaryButton() {

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Commentary Box</CardTitle>
                <CardDescription>
                    Share your cricket knowledge with the community and earn rewards.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/contribute">
                        <div className="flex items-center">
                            <Edit className="mr-4" />
                            Contribute Now
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}
