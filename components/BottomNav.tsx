'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Gift, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Hide nav on auth pages and quiz pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/quiz') || pathname.startsWith('/walkthrough')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t z-50">
      <nav id="tour-step-3" className="flex h-full items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center h-full text-sm font-medium transition-colors relative group',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
               <motion.div
                whileHover={{ y: -5, scale: 1.1 }}
                transition={{ type: 'spring', stiffness: 300 }}
               >
                <item.icon className="h-6 w-6 mb-0.5" />
               </motion.div>
              <span className="text-xs relative">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
