
'use client';

import React, { useState, useMemo, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ExternalLink, WifiOff, ServerCrash, Play, Trophy } from 'lucide-react';
import Image from 'next/image';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import { brandData } from '@/components/home/brandData';
import { cn } from '@/lib/utils';

const ScratchCardSkeleton = () => (
    <div className="w-full aspect-[4/5] p-1">
        <Skeleton className="w-full h-full rounded-2xl bg-muted/50" />
    </div>
);

const RewardsSkeleton = () => (
  <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
        <p className="text-sm text-muted-foreground mb-4">You get a scratch card for each quiz attempt. Scratch to reveal!</p>
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
      <section>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
        <div className="space-y-4">
          <Skeleton className="h-[96px] w-full" />
          <Skeleton className="h-[96px] w-full" />
        </div>
      </section>
  </div>
);

const ErrorState = ({ message }: { message: string }) => (
    <Alert variant="destructive" className="mt-4">
        {message.includes("offline") || message.includes("unavailable") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Rewards</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const ScratchCard = memo(({ brand, slotId, timestamp }: { brand: string, slotId: string, timestamp: number }) => {
  const [isScratched, setIsScratched] = useState(false);
  const storageKey = useMemo(() => `indcric-scratch-card-${slotId}`, [slotId]);
  
  const brandInfo = useMemo(() => brandData.find(b => b.brand === brand) || { logoUrl: 'https://placehold.co/100x100.png' }, [brand]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedState = window.localStorage.getItem(storageKey);
    if (savedState === 'true') setIsScratched(true);
  }, [storageKey]);

  const handleScratch = () => {
    setIsScratched(true);
    window.localStorage.setItem(storageKey, 'true');
  };

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
                    className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-95 rounded-2xl p-2 text-center" 
                    onClick={handleScratch} 
                    role="button" 
                    aria-label={`Scratch to reveal gift from ${brand}`}
                >
                    <div className="w-16 h-16 relative mb-3">
                         <Image src={brandInfo.logoUrl} alt={`${brand} logo`} fill className="object-contain" data-ai-hint={`${brand} logo`} />
                    </div>
                    <p className="font-bold text-lg">Scratch to reveal!</p>
                    <p className="text-sm">From {brand}</p>
                </button>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center animate-fade-in-up">
                    <Trophy className="h-10 w-10 mb-2 text-current" />
                    <h3 className="text-lg font-bold text-current">{reward.gift}</h3>
                    <p className="text-xs text-current/80 mt-1">{reward.description}</p>
                    <Button onClick={() => window.open(reward.link, '_blank')} className="mt-4 bg-white/20 text-white hover:bg-white/30" size="sm">Claim Now <ExternalLink className="ml-2 h-4 w-4" /></Button>
                </div>
            )}
        </Card>
    </div>
  );
});
ScratchCard.displayName = 'ScratchCard';

export const GenericOffer = memo(({ title, description, image, hint, link }: { title: string, description: string, image: string, hint: string, link: string }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-103 animate-fade-in-up block">
        <Card className="bg-card/80 shadow-lg hover:border-primary/30">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center p-2 shadow-inner bg-white relative overflow-hidden flex-shrink-0">
                    <Image src={image} alt={title} fill className="object-contain" data-ai-hint={hint} />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0 text-muted-foreground hover:text-primary" aria-label={`Claim offer for ${title}`}><ExternalLink className="h-4 w-4 text-primary" /></Button>
            </CardContent>
        </Card>
    </a>
));
GenericOffer.displayName = 'GenericOffer';


function RewardsContentComponent() {
  const { user, quizHistory, loading } = useAuth();
  
  const rewardableAttempts = useMemo(() => {
    const uniqueAttempts = new Map<string, QuizAttempt>();
    for (let i = quizHistory.data.length - 1; i >= 0; i--) {
        const attempt = quizHistory.data[i];
        if (attempt.slotId) {
            uniqueAttempts.set(attempt.slotId, attempt);
        }
    }
    return Array.from(uniqueAttempts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [quizHistory.data]);

  const BrandGifts = () => {
    if (loading) return <RewardsSkeleton />;
    if (quizHistory.error) return <ErrorState message={quizHistory.error} />;
    if (!user) {
      return (
        <Card className="bg-card/80"><CardContent className="p-6 text-center text-muted-foreground"><Play className="h-10 w-10 mx-auto text-primary/50 mb-4" /><p className="font-semibold text-lg text-foreground">Play to Win!</p><p>Play a quiz to unlock exclusive brand gifts and rewards.</p><Button asChild size="sm" className="mt-4"><Link href="/home">Play a Quiz</Link></Button></CardContent></Card>
      );
    }
    if (rewardableAttempts.length === 0) {
      return (
        <Card className="bg-card/80"><CardContent className="p-6 text-center text-muted-foreground"><Gift className="h-10 w-10 mx-auto text-primary/50 mb-4" /><p className="font-semibold text-foreground mb-2">No Brand Gifts Yet</p><p className="text-sm">Play any quiz to unlock a special brand gift!</p></CardContent></Card>
      );
    }
    return (
      <Carousel opts={{ align: 'start' }} className="w-full max-w-full">
        <CarouselContent className="-ml-4">
          {rewardableAttempts.map((attempt, index) => (
            <CarouselItem key={`${attempt.slotId}-${index}`} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
              <ScratchCard 
                brand={attempt.brand} 
                slotId={attempt.slotId} 
                timestamp={attempt.timestamp}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden sm:flex" />
        <CarouselNext className="hidden sm:flex" />
      </Carousel>
    );
  };

  return (
    <>
      <section>
        <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
        <p className="text-sm text-muted-foreground mb-4">You get a scratch card for each quiz attempt. Scratch to reveal!</p>
        <BrandGifts />
      </section>
    </>
  );
}

const RewardsContent = memo(RewardsContentComponent);
export default RewardsContent;
