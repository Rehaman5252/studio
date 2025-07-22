
'use client';

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale } from 'lucide-react';

const Policies = () => {
  return (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <Scale /> Legal & Policies
            </CardTitle>
        </CardHeader>
        <CardContent>
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                    <AccordionTrigger>Referral Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>A user (referrer) earns a one-time ₹50 bonus for each unique new user (referee) who signs up using their valid referral link.</p>
                        <p>The bonus is only credited to the referrer after the referee achieves their first-ever perfect score (5/5) in any quiz format.</p>
                        <p>This perfect score must be achieved within 7 calendar days of the referee's sign-up date. Attempts after this period will not trigger the referral bonus.</p>
                        <p>A referrer cannot earn a bonus from the same referee more than once.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger>Daily Streak Terms</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                         <p>To maintain a daily streak, a user must complete 15 quizzes within a 24-hour period (defined as 12:00 AM to 11:59 PM IST).</p>
                        <p>The 15 quizzes must include a minimum of 2 quizzes from each of the 6 official formats (T20, ODI, Test, IPL, WPL, Mixed). The remaining 3 quizzes can be from any format.</p>
                        <p>Failure to meet the daily quota (either total quizzes or format-specific minimums) will result in the streak resetting to zero.</p>
                        <p>Streak milestone rewards are unlocked upon reaching the specified day count and are subject to verification. Reward amounts are indicative and may be distributed via various mechanisms like scratch cards, coupons, or leaderboard prizes.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-3">
                    <AccordionTrigger>Payout Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>Verified cash rewards and referral bonuses can be withdrawn to the UPI ID provided in the user's profile.</p>
                        <p>Payout requests are processed manually and may take up to 72 business hours to reflect in your account.</p>
                        <p>Minimum withdrawal limits and processing fees may apply. All transactions are subject to standard banking timelines.</p>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                    <AccordionTrigger>Privacy Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>We collect personal data (name, email, phone, etc.) to provide and improve our services, including processing payouts and personalizing your experience. We do not sell your data to third parties.</p>
                        <p>Your data is stored securely using industry-standard encryption and security protocols.</p>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                    <AccordionTrigger>Cookie Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>We use essential cookies to manage your session and authentication. We do not use third-party tracking cookies for advertising purposes.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                    <AccordionTrigger>Responsible Gaming</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>CricBlitz is intended for entertainment and educational purposes to enhance cricket knowledge. While real rewards are offered, we encourage responsible participation.</p>
                        <p>Please play within your limits. Do not treat this platform as a primary source of income. If you feel your gaming habits are becoming problematic, we urge you to seek support from relevant counseling services.</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
  );
};

export default Policies;
