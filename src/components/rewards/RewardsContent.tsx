
'use client';

import React, { useState, useMemo, memo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ExternalLink, WifiOff, ServerCrash, Play, Trophy } from 'lucide-react';
import Image from 'next/image';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { db } from '@/lib/firebaseClient';
import { collection, query, getDocs, orderBy, limit } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';
import Link from 'next/link';

const ScratchCardSkeleton = () => (
    <div className="w-full aspect-square p-1">
        <Skeleton className="w-full h-full rounded-2xl" />
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
    const savedState = window.localStorage.getItem(storageKey);
    if (savedState === 'true') setIsScratched(true);
  }, [storageKey]);

  const handleScratch = () => {
    setIsScratched(true);
    window.localStorage.setItem(storageKey, 'true');
  };

  const rewardsByBrand: { [key: string]: { gift: string; description: string; link: string; } } = {
    'Amazon': { gift: '₹150 Gift Card', description: 'Credited to your Amazon Pay.', link: '#' },
    'Nike': { gift: 'Free Shipping', description: 'On your next order over ₹2000.', link: '#' },
    'Netflix': { gift: '1 Month Free', description: 'Subscription credit added.', link: '#' },
    'Mastercard': { gift: '₹250 Myntra Voucher', description: 'Valid on spends over ₹1000.', link: '#' },
    'Default Brand': { gift: 'Surprise Gift!', description: 'A special reward from indcric.', link: '#' },
  };
  const reward = rewardsByBrand[brand] || rewardsByBrand['Default Brand'];

  return (
    <div className="w-full aspect-square p-1">
        <Card className="bg-gradient-to-br from-primary to-yellow-400 text-primary-foreground p-0 overflow-hidden shadow-lg relative w-full h-full rounded-2xl">
            {!isScratched ? (
                <motion.button className="absolute inset-0 bg-zinc-300 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-90 rounded-2xl p-2 text-center" onClick={handleScratch} role="button" aria-label={`Scratch to reveal gift from ${brand}`} whileTap={{ scale: 0.95 }}>
                    <p className="font-bold text-zinc-600 text-lg">Scratch to reveal!</p>
                    <p className="text-zinc-500 text-sm">From {brand}</p>
                </motion.button>
            ) : (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col items-center justify-center p-4 text-center">
                    <Trophy className="h-10 w-10 mb-2 text-white" />
                    <h3 className="text-lg font-bold">{reward.gift}</h3>
                    <p className="text-xs opacity-80 mt-1">{reward.description}</p>
                    <Button onClick={() => window.open(reward.link, '_blank')} className="mt-3 bg-white text-black hover:bg-white/90" size="sm">Claim Now <ExternalLink className="ml-2 h-4 w-4" /></Button>
                </motion.div>
            )}
        </Card>
    </div>
  );
});
ScratchCard.displayName = 'ScratchCard';

const GenericOffer = memo(({ title, description, image, hint }: { title: string, description: string, image: string, hint: string }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.3 }} className="transition-transform hover:scale-103">
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
                <Image src={image} alt={title} width={80} height={80} className="rounded-md" data-ai-hint={hint} />
                <div>
                    <h4 className="font-bold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" aria-label={`Claim offer for ${title}`}><ExternalLink className="text-muted-foreground" /></Button>
            </CardContent>
        </Card>
    </motion.div>
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
        setError("Firestore not available. Please check your connection.");
        setLoading(false);
        return;
    }

    const fetchHistory = async () => {
        setLoading(true);
        setError(null);
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
    };

    fetchHistory();
  }, [user, authLoading]);

  const hasAttempts = history.length > 0;
  const rewardableAttempts = useMemo(() => {
    const uniqueAttempts = new Map<string, QuizAttempt>();
    history.forEach(attempt => {
      if (!attempt.reason) {
        const key = `${attempt.brand}-${new Date(attempt.timestamp).toDateString()}`;
        if (!uniqueAttempts.has(key)) uniqueAttempts.set(key, attempt);
      }
    });
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
        <Card className="bg-card/80 border-dashed border-primary/30">
            <CardContent className="p-6 text-center text-muted-foreground">
                <Play className="h-10 w-10 mx-auto text-primary/50 mb-4" />
                <p className="font-semibold text-lg text-foreground">Play to Win!</p>
                <p>Log in and play a quiz to unlock exclusive brand gifts.</p>
                <Button asChild size="sm" className="mt-4"><Link href="/auth/login?from=/rewards">Login to Play</Link></Button>
            </CardContent>
        </Card>
      );
  }

  if (rewardableAttempts.length > 0) {
      return (
        <Carousel opts={{ align: 'start' }} className="w-full max-w-full"><CarouselContent className="-ml-4">{rewardableAttempts.map((attempt, index) => (<CarouselItem key={`${attempt.brand}-${attempt.timestamp}-${index}`} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4"><ScratchCard brand={attempt.brand} slotId={attempt.slotId} timestamp={attempt.timestamp} /></CarouselItem>))}</CarouselContent><CarouselPrevious className="hidden sm:flex" /><CarouselNext className="hidden sm:flex" /></Carousel>
      );
  }

  return (
    <Card className="bg-card/80 border-dashed border-primary/30"><CardContent className="p-6 text-center text-muted-foreground"><Gift className="h-10 w-10 mx-auto text-primary/50 mb-4" /><p className="font-semibold text-foreground mb-2">{hasAttempts ? "All rewards claimed!" : "No Brand Gifts Yet"}</p><p className="text-sm">{hasAttempts ? "Play again in a new slot for more chances to win." : "Play any quiz to unlock a special brand gift!"}</p></CardContent></Card>
  )
}

export default function RewardsContent() {
  return (
    <>
      <section>
        <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
        <p className="text-sm text-muted-foreground mb-4">You get a scratch card for each quiz attempt. Scratch to reveal!</p>
        <BrandGifts />
      </section>
      <section className='mt-8'>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
        <div className="space-y-4">
          <GenericOffer title="20% off on Puma Shoes" description="Use code: INDCRIC20" image="https://placehold.co/100x100.png" hint="shoes sport" />
          <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" image="https://placehold.co/100x100.png" hint="food delivery" />
          <GenericOffer title="HDFC Credit Card Offer" description="5% cashback on all spends over ₹5000." image="https://placehold.co/100x100.png" hint="finance bank" />
          <GenericOffer title="₹200 Off on Flipkart" description="On electronics and accessories. Min. spend ₹2000." image="https://placehold.co/100x100.png" hint="shopping cart" />
          <GenericOffer title="Myntra: 25% Off" description="On select fashion apparel. Use code: MYN25" image="https://placehold.co/100x100.png" hint="fashion clothing" />
          <GenericOffer title="Nykaa Beauty Bonanza" description="Get a free lipstick on orders over ₹1500." image="https://placehold.co/100x100.png" hint="cosmetics makeup" />
        </div>
      </section>
    </>
  );
}

    