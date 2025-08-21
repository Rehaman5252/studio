'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Gift, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialShareButtons } from './SocialShareButtons';

const ReferralCardComponent = ({ referralCode, referralEarnings }: { referralCode: string, referralEarnings: number }) => {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = React.useState(false);
    const referralLink = `https://cricblitz.app/auth/signup?ref=${referralCode}`;

    const onCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setHasCopied(true);
        toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
        setTimeout(() => setHasCopied(false), 2000);
    };

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Gift /> Refer & Earn</CardTitle>
                <CardDescription>
                    Invite friends to CricBlitz! You'll earn a bonus for every friend who signs up and scores their first perfect quiz.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                 <div className="flex items-center space-x-2">
                    <div className="grid flex-1 gap-1">
                        <p className="text-xs font-semibold text-muted-foreground">YOUR REFERRAL LINK</p>
                        <p className="text-sm font-mono p-2 border rounded-md bg-secondary truncate">{referralLink}</p>
                    </div>
                    <Button onClick={onCopy} size="icon" className="shrink-0">
                        {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <span className="font-semibold text-muted-foreground text-sm">Total Referral Earnings:</span>
                    <span className="font-bold text-primary text-lg">₹{referralEarnings || 0}</span>
                </div>
                <div>
                   <p className="text-center text-xs text-muted-foreground mb-1">Share via</p>
                   <SocialShareButtons referralLink={referralLink} />
                </div>
            </CardContent>
        </Card>
    );
};

const ReferralCard = memo(ReferralCardComponent);
export default ReferralCard;
