
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import Link from 'next/link';

const SupportCardComponent = () => {
    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Help & Support</CardTitle>
                <CardDescription>Connect to reach the Third Umpire.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/support">
                        <MessageSquare className="mr-4" />
                        Contact Us
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
};

const SupportCard = memo(SupportCardComponent);
export default SupportCard;
