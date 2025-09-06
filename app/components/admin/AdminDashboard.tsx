
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, HelpCircle, Gift, Banknote, LogOut } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';


const StatCard = ({ title, value, icon, description }: { title: string; value: string; icon: React.ReactNode; description: string; }) => (
    <Card className="shadow-md hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            {icon}
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
        </CardContent>
    </Card>
);

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  
  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: "Signed Out" });
    router.replace('/admin/login');
  };

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Dashboard</CardTitle>
                <CardDescription>An overview of the indcric platform.</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4"/>
                Sign Out
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                 <StatCard 
                    title="Total Users" 
                    value="1,234" 
                    icon={<Users className="h-4 w-4 text-muted-foreground" />} 
                    description="+20.1% from last month" 
                />
                <StatCard 
                    title="Pending Payouts" 
                    value="₹12,500" 
                    icon={<Banknote className="h-4 w-4 text-muted-foreground" />} 
                    description="52 pending transactions" 
                />
                <StatCard 
                    title="Pending Questions" 
                    value="89" 
                    icon={<HelpCircle className="h-4 w-4 text-muted-foreground" />} 
                    description="In moderation queue" 
                />
                <StatCard 
                    title="Active Ad Campaigns" 
                    value="12" 
                    icon={<Gift className="h-4 w-4 text-muted-foreground" />} 
                    description="Across all formats" 
                />
            </div>
            {/* Additional charts and tables will go here */}
        </CardContent>
    </Card>
  );
}
