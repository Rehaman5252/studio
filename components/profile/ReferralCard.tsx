
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Gift, Check, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { SocialShareButtons } from '@/components/profile/SocialShareButtons';
import { Input } from '@/components/ui/input';

const ReferralCardComponent = ({ referralCode, referralEarnings }: { referralCode: string, referralEarnings: number }) => {
    const { toast } = useToast();
    const [hasCopied, setHasCopied] = React.useState(false);
    const referralLink = `https://indcric.app/auth/signup?ref=${referralCode}`;

    const onCopy = async () => {
        if (!navigator.clipboard) {
            toast({ title: 'Failed to copy', description: 'Clipboard API not available in this browser.', variant: "destructive" });
            return;
        }
        try {
            await navigator.clipboard.writeText(referralLink);
            setHasCopied(true);
            toast({ title: 'Copied!', description: 'Referral link copied to clipboard.' });
            setTimeout(() => setHasCopied(false), 2000);
        } catch (err) {
            toast({ title: 'Failed to copy', description: 'Could not copy link to clipboard.', variant: "destructive" });
        }
    };

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Users className="text-primary"/> Build Your Squad</CardTitle>
                <CardDescription>
                    Invite friends to form a partnership. You'll earn a bonus for every teammate who signs up and scores their first perfect quiz.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="flex items-center space-x-2">
                    <Input 
                        readOnly 
                        value={referralLink} 
                        className="text-sm font-mono flex-1 bg-secondary/50 cursor-text" 
                        onFocus={(e) => e.target.select()}
                        aria-label="Referral Link"
                    />
                    <Button onClick={onCopy} size="icon" variant="outline" className="shrink-0" aria-label="Copy referral link" type="button">
                        {hasCopied ? <Check className="h-4 w-4 text-green-500 animate-bounce" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>
                <div className="flex items-center justify-between p-2 bg-secondary rounded-lg">
                    <span className="font-semibold text-muted-foreground text-sm">Total Partnership Earnings:</span>
                    <span className="font-bold text-primary text-lg">₹{referralEarnings || 0}</span>
                </div>
                <div>
                   <p className="text-center text-xs text-muted-foreground mb-2">Share via</p>
                   <SocialShareButtons referralLink={referralLink} />
                </div>
            </CardContent>
        </Card>
    );
};

const ReferralCard = memo(ReferralCardComponent);
export default ReferralCard;
