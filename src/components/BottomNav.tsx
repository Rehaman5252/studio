
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User, Gift, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    <div className="fixed bottom-0 inset-x-0 h-20 flex justify-center z-50 pointer-events-none">
       <div 
        className="nav-container absolute bottom-4 w-[95%] max-w-lg mx-auto pointer-events-auto"
       >
         <nav className="relative flex justify-around h-16 items-center bg-background/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                  <div
                      key={label}
                      className="nav-item relative flex-1 h-full flex items-center justify-center"
                  >
                      <Link href={href} prefetch={true} className="w-full h-full flex flex-col items-center justify-center gap-1 z-10 rounded-lg" aria-label={label}>
                          <Icon className={cn("h-6 w-6 transition-colors duration-200", isActive ? 'text-primary' : 'text-muted-foreground')} aria-hidden="true" />
                          <span className={cn("text-xs font-medium transition-colors duration-200", isActive ? 'text-primary' : 'text-muted-foreground')}>{label}</span>
                      </Link>
                      {isActive && (
                          <div
                              className="active-nav-indicator absolute inset-1 bg-primary/20 rounded-xl z-0"
                          />
                      )}
                  </div>
              );
            })}
         </nav>
       </div>
    </div>
  );
}
