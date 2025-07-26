
'use client';

import React, { useState, useMemo, memo, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ExternalLink, WifiOff, ServerCrash, Play, Trophy, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { db } from '@/lib/firebase';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';
import LoginPrompt from '../auth/LoginPrompt';

const ScratchCardSkeleton = () => (
    <div className="w-full aspect-square p-1">
        <Skeleton className="w-full h-full rounded-2xl" />
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
        {message.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
        <AlertTitle>Error Loading Rewards</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
    </Alert>
);

const ScratchCard = memo(({ brand, slotId, timestamp }: { brand: string, slotId: string, timestamp: number }) => {
  const [isScratched, setIsScratched] = useState(false);
  const storageKey = useMemo(() => `scratch-card-${slotId}-${brand}-${timestamp}`, [slotId, brand, timestamp]);

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
    'Default Brand': { gift: 'Surprise Gift!', description: 'A special reward from indcric.', link: '#' },
    'ICICI': { gift: '₹100 Cashback', description: 'On your next credit card bill.', link: 'https://www.icicibank.com/' },
    'Gucci': { gift: 'Exclusive 10% Off', description: 'On select luxury items.', link: 'https://www.gucci.com/us/en/' },
    'Mixed': { gift: 'Mystery Box', description: 'A special reward from indcric.', link: '#' },
  };
  const reward = rewardsByBrand[brand] || rewardsByBrand['Default Brand'];

  return (
    <div className="w-full aspect-square p-1">
        <Card className="bg-gradient-to-br from-primary to-yellow-400 text-primary-foreground p-0 overflow-hidden shadow-lg relative w-full h-full rounded-2xl">
            {!isScratched ? (
                <button className="absolute inset-0 bg-zinc-300 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-90 rounded-2xl p-2 text-center" onClick={handleScratch} role="button" aria-label={`Scratch to reveal gift from ${brand}`}>
                    <p className="font-bold text-zinc-600 text-lg">Scratch to reveal!</p>
                    <p className="text-zinc-500 text-sm">From {brand}</p>
                </button>
            ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                    <Trophy className="h-10 w-10 mb-2 text-white" />
                    <h3 className="text-lg font-bold">{reward.gift}</h3>
                    <p className="text-xs opacity-80 mt-1">{reward.description}</p>
                    <Button onClick={() => window.open(reward.link, '_blank')} className="mt-3 bg-white text-black hover:bg-white/90" size="sm">Claim Now <ExternalLink className="ml-2 h-4 w-4" /></Button>
                </div>
            )}
        </Card>
    </div>
  );
});
ScratchCard.displayName = 'ScratchCard';

const GenericOffer = memo(({ title, description, image, hint, link }: { title: string, description: string, image: string, hint: string, link: string }) => (
    <a href={link} target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-103 animate-fade-in-up block">
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
                <div className="w-16 h-16 rounded-full flex items-center justify-center p-1 shadow-inner bg-white relative overflow-hidden flex-shrink-0">
                    <Image src={image} alt={title} fill className="object-contain" data-ai-hint={hint} />
                </div>
                <div className="flex-grow">
                    <h4 className="font-bold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto flex-shrink-0" aria-label={`Claim offer for ${title}`}><ExternalLink className="text-muted-foreground" /></Button>
            </CardContent>
        </Card>
    </a>
));
GenericOffer.displayName = 'GenericOffer';

const BrandGifts = () => {
  const { user, loading: authLoading } = useAuth();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setLoading(false); return; }
    if (!db) { 
        setError("Database not connected.");
        setLoading(false); 
        return;
    }

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
        if (typeof window !== "undefined") {
            try {
                const q = query(collection(db, "users", user.uid, "quizAttempts"), orderBy("timestamp", "desc"), limit(50));
                const snap = await getDocs(q);
                setHistory(snap.docs.map(d => d.data() as QuizAttempt));
            } catch (e: any) {
                console.error("Rewards Fetch Error:", e);
                if (e.code === 'unavailable') {
                    setError("You appear to be offline. Please check your connection.");
                } else {
                    setError("Unable to load rewards data.");
                }
            } finally {
                setLoading(false);
            }
        }
    };

    fetchHistory();
  }, [user, authLoading]);

  // Logic to get one rewardable attempt per slot. This now correctly includes malpractice attempts.
  const rewardableAttempts = useMemo(() => {
    const uniqueAttempts = new Map<string, QuizAttempt>();
    // Iterate in reverse to keep the EARLIEST attempt in a slot if multiple exist
    for (let i = history.length - 1; i >= 0; i--) {
        const attempt = history[i];
        // Key is the slot ID, guaranteeing one card per slot attempt.
        const key = attempt.slotId;
        uniqueAttempts.set(key, attempt);
    }
    // Return all unique attempts, sorted by time descending to show newest first
    return Array.from(uniqueAttempts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);

  if (loading || authLoading) {
      return (
        <Carousel opts={{ align: 'start' }} className="w-full max-w-full">
            <CarouselContent className="-ml-4">
                {[...Array(3)].map((_, index) => (
                    <CarouselItem key={index} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                        <ScratchCardSkeleton />
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
      )
  }

  if (error) return <ErrorState message={error} />;

  if (!user) {
      return (
        <Card className="bg-card/80 border-dashed border-primary/30"><CardContent className="p-6 text-center text-muted-foreground"><Play className="h-10 w-10 mx-auto text-primary/50 mb-4" /><p className="font-semibold text-lg text-foreground">Play to Win!</p><p>Log in and play a quiz to unlock exclusive brand gifts.</p><Button asChild size="sm" className="mt-4"><Link href="/auth/login?from=/rewards">Login to Play</Link></Button></CardContent></Card>
      );
  }

  if (rewardableAttempts.length > 0) {
      return (
        <Carousel opts={{ align: 'start' }} className="w-full max-w-full"><CarouselContent className="-ml-4">{rewardableAttempts.map((attempt, index) => (<CarouselItem key={`${attempt.slotId}-${index}`} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4"><ScratchCard brand={attempt.brand} slotId={attempt.slotId} timestamp={attempt.timestamp} /></CarouselItem>))}</CarouselContent><CarouselPrevious className="hidden sm:flex" /><CarouselNext className="hidden sm:flex" /></Carousel>
      );
  }

  return (
    <Card className="bg-card/80 border-dashed border-primary/30"><CardContent className="p-6 text-center text-muted-foreground"><Gift className="h-10 w-10 mx-auto text-primary/50 mb-4" /><p className="font-semibold text-foreground mb-2">No Brand Gifts Yet</p><p className="text-sm">Play any quiz to unlock a special brand gift!</p></CardContent></Card>
  )
}

function RewardsContentComponent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
        <p className="text-sm text-muted-foreground mb-4">You get a scratch card for each quiz attempt. Scratch to reveal!</p>
        <Suspense fallback={<RewardsSkeleton />}>
            <BrandGifts />
        </Suspense>
      </section>
      <section className='mt-8'>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
        <div className="space-y-4">
          <GenericOffer title="20% off on Puma Shoes" description="Use code: indcric20" image="https://www.freepnglogos.com/uploads/puma-logo-png-1.png" hint="shoes sport" link="https://in.puma.com/" />
          <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" image="https://cdn.icon-icons.com/icons2/2803/PNG/512/swiggy_logo_icon_178723.png" hint="food delivery" link="https://www.swiggy.com/" />
          <GenericOffer title="HDFC Credit Card Offer" description="5% cashback on all spends over ₹5000." image="https://www.pngkey.com/png/full/223-2231200_hdfc-bank-hdfc-bank-logo-png.png" hint="finance bank" link="https://www.hdfcbank.com/" />
          <GenericOffer title="₹200 Off on Flipkart" description="On electronics and accessories. Min. spend ₹2000." image="https://logolook.net/wp-content/uploads/2021/07/Flipkart-logo.png" hint="shopping cart" link="https://www.flipkart.com/" />
        </div>
      </section>
    </>
  );
}

const RewardsContent = memo(RewardsContentComponent);
export default RewardsContent;

    