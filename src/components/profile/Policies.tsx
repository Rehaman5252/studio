
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
                <AccordionItem value="fair-play">
                    <AccordionTrigger className="font-bold">Fair Play Policy (Malpractice)</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>Each user gets a maximum of **3 warnings per day** — we call them **"No-Balls"**.</p>
                        <p>Every time malpractice is detected (like switching tabs during a quiz), it's counted as a **No-Ball**. The quiz is immediately terminated for that attempt.</p>
                        <p>On the **third No-Ball of the day**, the user is **declared "Out for the Day"** — meaning they cannot participate in any more quizzes until the next day.</p>
                        <p>Users will receive a live warning after each No-Ball. The No-Ball count resets at midnight IST daily. This rule is strictly enforced to ensure a level playing field for all participants.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-1">
                    <AccordionTrigger>Referral Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>A user (referrer) earns a one-time ₹50 bonus for each unique new user (referee) who signs up using their valid referral link.</p>
                        <p>The bonus is only credited to the referrer after the referee achieves their first-ever perfect score (5/5) in any quiz format.</p>
                        <p>This perfect score must be achieved within 7 calendar days of the referee's sign-up date. Attempts after this period will not trigger the referral bonus.</p>
                        <p>A referrer cannot earn a bonus from the same referee more than once. CricBlitz reserves the right to invalidate bonuses earned through fraudulent means (e.g., fake accounts, automated scripts).</p>
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
                        <p>Verified cash rewards and referral bonuses can be withdrawn to the UPI ID provided in the user's profile. It is the user's responsibility to ensure the provided UPI ID is correct.</p>
                        <p>Payout requests are processed manually and may take up to 72 business hours (excluding weekends and public holidays) to reflect in your account.</p>
                        <p>Minimum withdrawal limits and processing fees may apply. All transactions are subject to standard banking timelines and RBI regulations.</p>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-4">
                    <AccordionTrigger>Privacy Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>We collect personal data (name, email, phone, etc.) to provide and improve our services, including processing payouts and personalizing your experience, in compliance with the Information Technology Act, 2000 of India. We do not sell your data to third parties.</p>
                        <p>Your data is stored securely using industry-standard encryption and security protocols. You have the right to request access to or deletion of your personal data by contacting our support team.</p>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-5">
                    <AccordionTrigger>Cookie Policy</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>We use essential cookies to manage your session and authentication. We do not use third-party tracking cookies for advertising purposes. By using CricBlitz, you consent to the use of these essential cookies.</p>
                    </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-6">
                    <AccordionTrigger>Responsible Participation & Platform Mission</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground space-y-2">
                        <p>CricBlitz is foremost a platform for knowledge sharing, testing, and learning, designed for educational purposes to enhance cricket knowledge. While real rewards are offered as an incentive for engagement, it is classified as a game of skill, not a game of chance.</p>
                        <p>We encourage responsible participation. Please play within your limits and for the joy of learning. This platform should not be treated as a primary source of income. If you feel your gaming habits are becoming problematic, we urge you to seek support from relevant counseling services. Users must be 18 years or older to participate.</p>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardContent>
    </Card>
  );
};

export default Policies;
