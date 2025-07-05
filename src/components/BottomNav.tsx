
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
    <div className="fixed bottom-0 inset-x-0 h-20 flex justify-center z-50">
       <div className="absolute bottom-4 w-[95%] max-w-lg mx-auto">
         <nav className="relative flex justify-around h-16 items-center bg-background/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40">
            {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
                <motion.div
                    key={label}
                    className="relative flex-1 h-full flex items-center justify-center"
                    whileTap={{ scale: 0.9, y: 2, transition: { type: 'spring', stiffness: 400, damping: 15 } }}
                >
                    <Link href={href} className="w-full h-full flex flex-col items-center justify-center gap-1 z-10">
                        <Icon className={cn("h-6 w-6 transition-colors", isActive ? 'text-primary' : 'text-muted-foreground')} />
                        <span className={cn("text-xs font-medium transition-colors", isActive ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
                    </Link>
                    {isActive && (
                        <motion.div
                            layoutId="active-nav-indicator"
                            className="absolute inset-1 bg-primary/20 rounded-xl z-0"
                            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                    )}
                </motion.div>
            );
            })}
         </nav>
       </div>
    </div>
  );
}
