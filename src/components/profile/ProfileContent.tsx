
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Award, Settings, LogOut, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileHeader from './ProfileHeader';
import ProfileCompletion from './ProfileCompletion';
import StatsSummary from './StatsSummary';
import ReferralCard from './ReferralCard';
import SupportCard from './SupportCard';
import DailyStreakCard from './DailyStreakCard';
import { useAuth } from '@/context/AuthProvider';
import Policies from './Policies';


export default function ProfileContent({ userProfile }: { userProfile: any }) {
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        router.replace('/auth/login');
    };

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
            
            <div className="space-y-6">
              <ProfileCompletion userProfile={userProfile} />
              <DailyStreakCard userProfile={userProfile} />
              <StatsSummary userProfile={userProfile} />
              <ReferralCard userProfile={userProfile} />
            </div>

            <section className="space-y-3 pt-4">
                <h3 className="text-lg font-semibold text-center text-muted-foreground">My Account</h3>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/rewards"><Gift className="mr-4" /> My Trophy Cabinet</Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/certificates" prefetch={true}><Award className="mr-4" /> View Certificates</Link>
                </Button>
            </section>
            
            <div className="space-y-3 pt-4">
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/settings"><Settings className="mr-4" /> App Settings</Link>
                </Button>
                 <SupportCard />
            </div>

            <Policies />

            <section className="pt-4">
                <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
            </section>
        </div>
    );
}
