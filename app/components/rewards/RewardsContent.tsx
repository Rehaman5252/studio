
'use client';

import React, { useState, useMemo, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ExternalLink, WifiOff, ServerCrash, Trophy, Lock } from 'lucide-react';
import Image from 'next/image';
import type { QuizAttempt } from '@/ai/schemas';
import { useAuth } from '@/context/AuthProvider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { brandData } from '@/components/home/brandData';
import { cn } from '@/lib/utils';
import { normalizeTimestamp } from '@/lib/dates';
import { EmptyState } from '../EmptyState';
import LoginPrompt from '../auth/LoginPrompt';

const ScratchCardSkeleton = () => (
    <div className="w-full aspect-[4/5] p-1">
        <Skeleton className="w-full h-full rounded-2xl bg-muted/50" />
    </div>
);

const RewardsSkeleton = () => (
  <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Man of the Match Awards</h2>
        <p className="text-sm text-muted-foreground mb-4">A special award for every match you play. Claim your prize!</p>
        <Carousel opts={{ align: 'start' }} className="w-full max-w-full">
            <CarouselContent className="-ml-4">
                {[...Array(3)].map((_, index) => (
                    <CarouselItem key={index} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                        <ScratchCardSkeleton />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
      </section>
  </div>
);

const ErrorStateDisplay = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("network") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Rewards</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const ScratchCard = memo(({ brand, onScratch, isScratched }: { brand: string, onScratch: () => void, isScratched: boolean }) => {
  const brandInfo = useMemo(() => brandData.find(b => b.brand === brand) || { logoUrl: 'https://placehold.co/100x100.png' }, [brand]);
  
  const rewardsByBrand: { [key: string]: { gift: string; description: string; link: string; } } = {
    'Amazon': { gift: '₹150 Gift Card', description: 'Credited to your Amazon Pay.', link: 'https://www.amazon.in/gp/sva/dashboard' },
    'Nike': { gift: 'Free Shipping', description: 'On your next order over ₹2000.', link: 'https://www.nike.com/in/' },
    'Netflix': { gift: '1 Month Free', description: 'Subscription credit added.', link: 'https://www.netflix.com/in/' },
    'Mastercard': { gift: '₹250 Myntra Voucher', description: 'Valid on spends over ₹1000.', link: 'https://www.myntra.com/' },
    'ICICI': { gift: '₹100 Cashback', description: 'On your next credit card bill.', link: 'https://www.icicibank.com/' },
    'Gucci': { gift: 'Exclusive 10% Off', description: 'On select luxury items.', link: 'https://www.gucci.com/us/en/' },
    'Default Brand': { gift: 'Surprise Gift!', description: 'A special reward from indcric.', link: '#' },
  };
  const reward = rewardsByBrand[brand] || rewardsByBrand['Default Brand'];

  return (
    <div className="w-full aspect-[4/5] p-1">
        <Card className={cn(
            "p-0 overflow-hidden shadow-lg relative w-full h-full rounded-2xl transition-all duration-500",
            isScratched
                ? "bg-gradient-to-br from-amber-200 to-yellow-400 text-amber-900"
                : "bg-gradient-to-br from-yellow-400 to-amber-600 text-white"
        )}>
            {!isScratched ? (
                <button 
                    type="button"
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-95 rounded-2xl p-2 text-center" 
                    onClick={onScratch} 
                    role="button" 
                    aria-label={`Scratch to reveal gift from ${brand}`}
                >
                    <div className="w-16 h-16 relative mb-3">
                         <Image src={brandInfo.logoUrl} alt={`${brand} logo`} fill className="object-contain" data-ai-hint={`${brand} logo`} priority={false} loading="lazy" />
                    </div>
                    <p className="font-bold text-lg">Unpack Your Reward</p>
                    <p className="text-sm">From {brand}</p>
                </button>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
                    <Trophy className="h-10 w-10 mb-2 text-current" />
                    <h3 className="text-lg font-bold text-current">{reward.gift}</h3>
                    <p className="text-xs text-current/80 mt-1">{reward.description}</p>
                    <Button onClick={() => window.open(reward.link, '_blank')} className="mt-4 bg-white/20 text-white hover:bg-white/30" size="sm" type="button">Claim Now <ExternalLink className="ml-2 h-4 w-4" /></Button>
                </div>
            )}
        </Card>
    </div>
  );
});
ScratchCard.displayName = 'ScratchCard';

const getStartOfWeek = (timestamp: any): number => {
    const date = normalizeTimestamp(timestamp);
    if (!date) return 0;
    const copiedDate = new Date(date.getTime()); // Create a copy
    const day = copiedDate.getDay();
    // Adjust to Monday as the start of the week (Sunday is 0)
    const diff = copiedDate.getDate() - day + (day === 0 ? -6 : 1); 
    copiedDate.setDate(diff);
    copiedDate.setHours(0, 0, 0, 0);
    return copiedDate.getTime();
};


function RewardsContentComponent() {
  const { user, quizHistory, loading: authLoading } = useAuth();
  const [scratchedCards, setScratchedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (user && typeof window !== 'undefined' && quizHistory.data.length > 0) {
      const initialScratchedState: Record<string, boolean> = {};
      quizHistory.data.forEach(attempt => {
        const storageKey = `indcric-scratch-card-${attempt.slotId}`;
        const savedState = window.localStorage.getItem(storageKey);
        if (savedState === 'true') {
          initialScratchedState[attempt.slotId] = true;
        }
      });
      setScratchedCards(initialScratchedState);
    }
  }, [quizHistory.data, user]);

  const handleScratch = (slotId: string) => {
    setScratchedCards(prev => ({ ...prev, [slotId]: true }));
    if (typeof window !== 'undefined') {
      const storageKey = `indcric-scratch-card-${slotId}`;
      window.localStorage.setItem(storageKey, 'true');
    }
  };
  
  const rewardableAttempts = useMemo(() => {
    if (!user) return [];
    // Sort all attempts newest first to ensure we process the most recent ones
    const sortedAttempts = [...quizHistory.data].sort((a, b) => {
      const timeA = normalizeTimestamp(a.timestamp)?.getTime() || 0;
      const timeB = normalizeTimestamp(b.timestamp)?.getTime() || 0;
      return timeB - timeA;
    });

    const weeklyBrandTracker = new Set<string>();
    const uniqueWeeklyAttempts: QuizAttempt[] = [];

    for (const attempt of sortedAttempts) {
      if (!attempt.brand || !attempt.timestamp) continue;

      const weekStartTimestamp = getStartOfWeek(attempt.timestamp);
      const brandWeekKey = `${attempt.brand}-${weekStartTimestamp}`;

      // If we haven't already added a reward for this brand in this week, add it.
      if (!weeklyBrandTracker.has(brandWeekKey)) {
        uniqueWeeklyAttempts.push(attempt);
        weeklyBrandTracker.add(brandWeekKey);
      }
    }
    
    // The list is already sorted by newest first from the initial sort.
    return uniqueWeeklyAttempts;
  }, [quizHistory.data, user]);

  const BrandGifts = () => {
    if (authLoading || quizHistory.loading) return <RewardsSkeleton />;
    if (quizHistory.error) return <ErrorStateDisplay message={quizHistory.error} />;

    if (!user) {
        return (
            <div className="pt-8">
                <LoginPrompt 
                    icon={Lock}
                    title="Unlock Your Kit Bag"
                    description="Your rewards are waiting! Sign in to scratch and claim your Man of the Match awards."
                />
            </div>
        )
    }
    
    if (rewardableAttempts.length === 0) {
      return (
        <EmptyState
            Icon={Gift}
            title="Your Kit Bag is Empty"
            description="Play a match to earn your first reward!"
        />
      );
    }
    return (
        <div className="relative pb-10">
            <Carousel opts={{ align: 'start' }} className="w-full max-w-full">
                <CarouselContent className="-ml-4">
                {rewardableAttempts.map((attempt, index) => (
                    <CarouselItem key={`${attempt.slotId}-${index}`} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                    <ScratchCard 
                        brand={attempt.brand as string}
                        isScratched={scratchedCards[attempt.slotId] || false}
                        onScratch={() => handleScratch(attempt.slotId)}
                    />
                    </CarouselItem>
                ))}
                </CarouselContent>
                 <div className="sm:hidden flex justify-center mt-4">
                    <CarouselPrevious className="relative static" />
                    <CarouselNext className="relative static" />
                </div>
            </Carousel>
        </div>
    );
  };

  return (
      <section>
        <h2 className="text-xl font-semibold text-foreground">Man of the Match Awards</h2>
        <p className="text-sm text-muted-foreground mb-4">A special award for every match you play. Claim your prize!</p>
        <BrandGifts />
      </section>
  );
}

const RewardsContent = memo(RewardsContentComponent);
export default RewardsContent;
