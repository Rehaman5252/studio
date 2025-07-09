'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, MessageSquare } from 'lucide-react';

function SupportCard() {
    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Help & Support</CardTitle>
                <CardDescription>Connect to reach the Third Umpire.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <a href="mailto:support@indcric.com">
                        <Mail className="mr-4" />
                        Email: support@indcric.com
                    </a>
                </Button>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <a href="https://wa.me/917842722245" target="_blank" rel="noopener noreferrer">
                        <MessageSquare className="mr-4" />
                        WhatsApp: +91 7842722245
                    </a>
                </Button>
            </CardContent>
        </Card>
    );
};

export default memo(SupportCard);
