
'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LayoutDashboard, Users, FileCheck, Banknote, LogOut, Shield } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const navItems = [
  { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/admin/users', icon: Users, label: 'Users' },
  { href: '/admin/submissions', icon: FileCheck, label: 'Submissions' },
  { href: '/admin/payouts', icon: Banknote, label: 'Payouts' },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  const handleLogout = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
      toast({ title: 'Signed Out' });
      router.replace('/admin/login');
    } catch (error) {
      toast({ title: 'Sign Out Error', description: 'Could not sign out.', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-card p-4 rounded-lg shadow-lg">
        <div className="flex items-center gap-2 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h2 className="text-xl font-bold">Admin Panel</h2>
        </div>
        <nav className="flex-1 space-y-2">
            {navItems.map(item => (
            <Button
                key={item.href}
                asChild
                variant={pathname === item.href ? 'secondary' : 'ghost'}
                className="w-full justify-start"
            >
                <Link href={item.href}>
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.label}
                </Link>
            </Button>
            ))}
        </nav>
        <div className="mt-auto">
            <Button variant="destructive" className="w-full justify-start" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
            </Button>
      </div>
    </div>
  );
}
