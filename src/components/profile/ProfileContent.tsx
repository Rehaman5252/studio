
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Award, Edit } from 'lucide-react';
import ProfileHeader from './ProfileHeader';
import ProfileCompletion from './ProfileCompletion';
import StatsSummary from './StatsSummary';
import ReferralCard from './ReferralCard';
import DailyStreakCard from './DailyStreakCard';

export default function ProfileContent({ userProfile }: { userProfile: any }) {

    if (!userProfile) {
        return <p>No profile data found.</p>;
    }

    return (
        <div className="space-y-6">
            <div className="relative">
                <ProfileHeader userProfile={userProfile} />
                <Button asChild variant="outline" size="icon" className="absolute top-4 right-4 rounded-full h-8 w-8" aria-label="Edit Profile">
                    <Link href="/complete-profile">
                        <Edit className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
            
            <div>
              <DailyStreakCard userProfile={userProfile} />
            </div>
            <ProfileCompletion userProfile={userProfile} />
            <StatsSummary userProfile={userProfile} />
            <ReferralCard userProfile={userProfile} />

            <section className="space-y-3 pt-4">
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/rewards" prefetch={true}><Gift className="mr-4" /> My Rewards</Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/certificates" prefetch={true}><Award className="mr-4" /> View Certificates</Link>
                </Button>
            </section>
        </div>
    );
}
