'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User, Gift, History } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/quiz-history', label: 'History', icon: History },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/rewards', label: 'Rewards', icon: Gift },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 inset-x-0 bg-background border-t z-50">
      <nav className="flex justify-around h-16 items-center max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link href={href} key={label} className={cn(
              "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors rounded-lg",
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary hover:bg-muted'
            )}>
              <Icon className="h-6 w-6" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
