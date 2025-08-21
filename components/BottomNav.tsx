
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, Gift, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/rewards', icon: Gift, label: 'Rewards' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const iconVariants = {
  initial: { y: 0 },
  animate: {
    y: [0, -4, 0],
    transition: {
      duration: 2.5,
      ease: "easeInOut",
      repeat: Infinity,
    },
  },
};

export default function BottomNav() {
  const pathname = usePathname();

  // Hide nav on auth pages and quiz pages
  if (pathname.startsWith('/auth') || pathname.startsWith('/quiz') || pathname.startsWith('/walkthrough')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 backdrop-blur-lg border-t z-50">
      <nav id="tour-step-3" className="flex h-full items-center justify-around max-w-md mx-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center h-full text-sm font-medium transition-colors relative',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary'
              )}
            >
              <motion.div 
                variants={iconVariants}
                initial="initial"
                animate={isActive ? "animate" : "initial"}
                transition={{
                  delay: index * 0.1, // Stagger the animation start
                }}
                whileTap={{ scale: 0.8, y: -5 }}
              >
                 <item.icon className="h-6 w-6 mb-0.5" />
              </motion.div>
              <span className="text-xs">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute bottom-0 h-1 w-8 rounded-full bg-primary"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { duration: 0.3 } }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
