'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Trophy,
  User,
  Gift,
  BarChartBig,
  History,
  LogOut,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Badge } from './ui/badge';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/quiz-history', label: 'History', icon: History },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
];

const NavLink = ({ href, label, icon: Icon }: (typeof navItems)[0]) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      <Button
        variant={isActive ? 'secondary' : 'ghost'}
        className="w-full justify-start"
      >
        <Icon className="mr-2 h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
};

export default function SideNav() {
  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-4 border-b">
        <Link href="/home" className="flex items-center gap-2">
          <span className="text-2xl">🏏</span>
          <h2 className="text-xl font-bold text-primary">CricBlitz</h2>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>
        
        <Separator className='my-4' />

        <div className="px-3 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">
            More
          </h2>
          <div className="flex flex-col gap-1">
            <Link href="/profile/settings" passHref>
              <Button variant="ghost" className="w-full justify-start">
                <Shield className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="p-4 border-t">
        <Link href="/profile">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted">
            <Avatar>
              <AvatarImage src="https://placehold.co/40x40" alt="User" data-ai-hint="profile avatar" />
              <AvatarFallback>CB</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">Cric Fan</p>
              <p className="text-xs text-muted-foreground">Level 5</p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </div>
        </Link>
        <Button variant="outline" className="w-full mt-2">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
