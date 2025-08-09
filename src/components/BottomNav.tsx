
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/home', icon: Home, label: 'Home', 'data-tour': 'step-3' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard', 'data-tour': 'step-3' },
  { href: '/rewards', icon: Gift, label: 'Rewards', 'data-tour': 'step-3' },
  { href: '/profile', icon: User, label: 'Profile', 'data-tour': 'step-3' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t z-50">
      <nav id="tour-step-3" className="grid h-full max-w-lg grid-cols-4 items-center mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center h-full text-sm font-medium transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-6 w-6 mb-0.5" />
              <span className="text-xs">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute bottom-0 h-1 w-8 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
