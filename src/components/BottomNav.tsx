'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, User, Gift, ScrollText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthProvider';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
  { href: '/home', label: 'Home', icon: Home, isPublic: true },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy, isPublic: true },
  { href: '/quiz-history', label: 'History', icon: ScrollText, isPublic: false },
  { href: '/rewards', label: 'Rewards', icon: Gift, isPublic: false },
  { href: '/profile', label: 'Profile', icon: User, isPublic: false },
];


const NavItemSkeleton = () => (
    <div className="relative flex-1 h-full flex items-center justify-center p-2">
        <div className="flex flex-col items-center justify-center gap-1.5 w-full">
            <Skeleton className="h-6 w-6 rounded-md" />
            <Skeleton className="h-2.5 w-10" />
        </div>
    </div>
);


export default function BottomNav() {
  const pathname = usePathname();
  const { user, loading } = useAuth(); // Get loading state

  return (
    <div className="fixed bottom-0 inset-x-0 h-20 flex justify-center z-50 pointer-events-none">
       <div 
        className="nav-container absolute bottom-4 w-[95%] max-w-lg mx-auto pointer-events-auto"
       >
         <nav className="relative flex justify-around h-16 items-center bg-background/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/40">
            {navItems.map(({ href, label, icon: Icon, isPublic }) => {

              if (!isPublic) {
                // Handle private routes based on auth state
                if (loading) {
                    return <NavItemSkeleton key={label} />;
                }
                if (!user) {
                    return <div key={label} className="flex-1 h-full" />; // Hide if not logged in
                }
              }
              
              // Render public routes or authenticated private routes
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
