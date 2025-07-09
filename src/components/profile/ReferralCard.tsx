'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Users, Copy } from 'lucide-react';

function ReferralCard({ userProfile }: { userProfile: any }) {
    const { toast } = useToast();
    const handleCopy = () => {
        const referralLink = userProfile?.referralCode || '';
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied to Clipboard!",
            description: "Your referral link has been copied.",
        });
    };

    return (
     <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Refer & Earn</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-xl">₹{userProfile?.referralEarnings || 0}</p>
                        <p className="text-sm text-muted-foreground">From Referrals</p>
                    </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2" />
                    Copy Link
                </Button>
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">{userProfile?.referralCode || 'No code available'}</p>
        </CardContent>
    </Card>
    );
};

export default memo(ReferralCard);
