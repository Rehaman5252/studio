'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LogOut, Award, BarChart, TrendingUp, UserPlus, Edit, Banknote, Users } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="bg-background/80 backdrop-blur-sm text-center">
        <CardContent className="p-4 flex flex-col items-center justify-center">
            <Icon className="h-8 w-8 mx-auto text-primary mb-2" />
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{title}</p>
        </CardContent>
    </Card>
)

const maskEmail = (email: string) => {
    const [user, domain] = email.split('@');
    if (user.length <= 2) return email;
    return `${user.substring(0, 2)}••@${domain}`;
};

const maskPhone = (phone: string) => {
    if (phone.length <= 4) return phone;
    return `${phone.substring(0, 4)}••••${phone.substring(phone.length - 2)}`;
};

export default function ProfilePage() {
    
    // Mock user data based on the spec
    const user = {
        name: 'CricBlitz User',
        email: 'user@example.com',
        phone: '9876543210',
        totalRewards: '₹600',
        highestStreak: 5,
        referralEarnings: '₹30',
        certificatesEarned: 6,
        quizzesPlayed: 27,
    };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/80 to-green-300/80 pb-20">
      <header className="p-4 bg-background/50 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
        <Button variant="ghost" size="icon">
            <LogOut />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8">
        <section className="text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background">
                <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="avatar person" />
                <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
            <p className="text-muted-foreground">
                {maskPhone(user.phone)}  •  {maskEmail(user.email)}
            </p>
        </section>

        <section className="grid grid-cols-2 gap-4">
            <StatCard title="Quizzes Played" value={user.quizzesPlayed} icon={BarChart} />
            <StatCard title="Highest Streak" value={user.highestStreak} icon={TrendingUp} />
            <StatCard title="Total Rewards" value={user.totalRewards} icon={Banknote} />
            <StatCard title="Referral Earnings" value={user.referralEarnings} icon={Users} />
            <StatCard title="Certificates" value={user.certificatesEarned} icon={Award} />
        </section>
        
        <section className="space-y-4">
             <Button size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <UserPlus className="mr-4" /> Refer & Earn
            </Button>
            <Button size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <Edit className="mr-4" /> Edit Profile
            </Button>
        </section>
      </main>
    </div>
  );
}
