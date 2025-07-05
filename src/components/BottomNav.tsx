'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User, Gift, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/quiz-history', label: 'History', icon: ScrollText },
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
            <Link href={href} key={label} className="relative flex-1 h-full">
              <motion.div
                className="flex flex-col items-center justify-center gap-1 w-full h-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className={cn("h-6 w-6 transition-colors", isActive ? 'text-primary' : 'text-muted-foreground')} />
                <span className={cn("text-xs font-medium transition-colors", isActive ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
                {isActive && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-1.5 h-1 w-1 rounded-full bg-primary"
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  />
                )}
              </motion.div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
