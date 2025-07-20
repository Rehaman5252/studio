'use client';
import { useState, useEffect, useMemo, memo } from "react";
import { useAuth } from "@/context/AuthProvider";
import { getFirebaseFirestore } from "@/lib/firebaseClient";
import { doc, getDoc } from "firebase/firestore";
import type { QuizAttempt } from '@/lib/mockData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ExternalLink, Play, Trophy, WifiOff, ServerCrash } from 'lucide-react';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { motion } from 'framer-motion';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Skeleton } from '../ui/skeleton';


const ScratchCardSkeleton = () => (
    <div className="w-full aspect-square p-1">
        <Skeleton className="w-full h-full rounded-2xl" />
    </div>
);

const RewardsSkeleton = () => (
  <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
        <p className="text-sm text-muted-foreground mb-4">You get a scratch card for each quiz attempt (one per brand per day). Scratch to reveal!</p>
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
        <AlertDescription>{message || "An unknown error occurred."}</AlertDescription>
    </Alert>
);

const ScratchCard = memo(({ brand, slotId, timestamp }: { brand: string, slotId: string, timestamp: number }) => {
  const [isScratched, setIsScratched] = useState(false);
  const storageKey = useMemo(() => `scratch-card-${slotId}-${brand}-${timestamp}`, [slotId, brand, timestamp]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedState = localStorage.getItem(storageKey);
    if (savedState === 'true') {
      setIsScratched(true);
    }
  }, [storageKey]);

  const handleScratch = () => {
    setIsScratched(true);
    localStorage.setItem(storageKey, 'true');
  };

  const rewardsByBrand: { [key: string]: { gift: string; description: string; link: string; } } = {
    'indcric': { gift: '₹50 Bonus', description: 'Bonus cash added to your wallet.', link: 'https://www.indcric.com' },
    'Default Brand': { gift: 'Surprise Gift!', description: 'A special reward from indcric.', link: '#' },
    'Apple': { gift: '10% off Accessories', description: 'On your next purchase.', link: '#' },
    'Nike': { gift: 'Free Shipping', description: 'On your next order over ₹2000.', link: '#' },
    'State Bank of India': { gift: '5% Cashback', description: 'On your next 3 transactions.', link: '#' },
    'PayPal': { gift: '₹100 Voucher', description: 'For your next online payment.', link: '#' },
    'WPL': { gift: 'Team Merchandise', description: 'Get a 20% discount coupon.', link: '#' },
    'Amazon': { gift: '₹150 Gift Card', description: 'Credited to your Amazon Pay.', link: '#' },
    'TATA': { gift: '₹200 Coupon', description: 'On TATA Cliq.', link: '#' },
    'ICICI': { gift: 'Exclusive Card Offers', description: 'Check your iMobile app.', link: '#' },
    'Gucci': { gift: '5% off Perfumes', description: 'On your next purchase.', link: '#' },
    'Mastercard': { gift: '₹250 Myntra Voucher', description: 'Valid on spends over ₹1000.', link: '#' },
    'Netflix': { gift: '1 Month Free', description: 'Subscription credit added.', link: '#' },
  };

  const reward = rewardsByBrand[brand] || rewardsByBrand['Default Brand'];

  return (
    <div className="w-full aspect-square p-1">
        <Card className="bg-gradient-to-br from-primary to-yellow-400 text-primary-foreground p-0 overflow-hidden shadow-lg relative w-full h-full rounded-2xl">
        {!isScratched ? (
            <motion.button
              className="absolute inset-0 bg-zinc-300 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-90 rounded-2xl p-2 text-center"
              onClick={handleScratch}
              role="button"
              aria-label={`Scratch to reveal gift from ${brand}`}
              whileTap={{ scale: 0.95 }}
            >
              <p className="font-bold text-zinc-600 text-lg">Scratch to reveal!</p>
              <p className="text-zinc-500 text-sm">From {brand}</p>
            </motion.button>
        ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="h-full flex flex-col items-center justify-center p-4 text-center"
            >
              <Trophy className="h-10 w-10 mb-2 text-white" />
              <h3 className="text-lg font-bold">{reward.gift}</h3>
              <p className="text-xs opacity-80 mt-1">{reward.description}</p>
              <Button
                  onClick={() => window.open(reward.link, '_blank')}
                  className="mt-3 bg-white text-black hover:bg-white/90"
                  size="sm"
              >
                  Claim Now <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </motion.div>
        )}
        </Card>
    </div>
  );
});
ScratchCard.displayName = 'ScratchCard';


const GenericOffer = memo(({ title, description, image, hint }: { title: string, description: string, image: string, hint: string }) => (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.3 }}
      className="transition-transform hover:scale-103"
    >
        <Card className="bg-card/80 border-primary/10 shadow-lg">
            <CardContent className="p-4 flex items-center gap-4">
                <Image src={image} alt={title} width={80} height={80} className="rounded-md" data-ai-hint={hint} />
                <div>
                    <h4 className="font-bold text-foreground">{title}</h4>
                    <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto" aria-label={`Claim offer for ${title}`}>
                    <ExternalLink className="text-muted-foreground" />
                </Button>
            </CardContent>
        </Card>
    </motion.div>
));
GenericOffer.displayName = 'GenericOffer';


export default function RewardsContent() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const db = getFirebaseFirestore();
    if (!db) { setError("Firestore not available."); setLoading(false); return; }

    setLoading(true);
    setError(null);
    (async () => {
      try {
        const historyRef = doc(db, "quizHistory", user.uid);
        const snap = await getDoc(historyRef);
        if (snap.exists()) {
          setHistory(snap.data().attempts || []);
        } else {
          setHistory([]);
        }
      } catch (e) {
        setError("Unable to load rewards.");
        console.error("Rewards fetch error:", e);
      }
      setLoading(false);
    })();
  }, [user]);

  const hasAttempts = history.length > 0;

  const rewardableAttempts = useMemo(() => {
    const uniqueAttempts = new Map<string, QuizAttempt>();
    const allAttempts = history.filter(attempt => !attempt.reason);

    for (const attempt of allAttempts) {
      const attemptDate = new Date(attempt.timestamp).toDateString();
      const key = `${attempt.brand}-${attemptDate}`;

      if (!uniqueAttempts.has(key)) {
        uniqueAttempts.set(key, attempt);
      }
    }
    return Array.from(uniqueAttempts.values()).sort((a, b) => b.timestamp - a.timestamp);
  }, [history]);
  
  if (loading) return <RewardsSkeleton />;

  return (
    <>
      <section>
        <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
        <p className="text-sm text-muted-foreground mb-4">You get a scratch card for each quiz attempt (one per brand per day). Scratch to reveal!</p>
        
        {error ? (
          <ErrorState message={error} />
        ) : !user ? (
          <Card className="bg-card/80 border-dashed border-primary/30">
            <CardContent className="p-6 text-center text-muted-foreground">
                <Play className="h-10 w-10 mx-auto text-primary/50 mb-4" />
                <p className="font-semibold text-lg text-foreground">Step up to the crease!</p>
                <p>Play a quiz to unlock exclusive brand gifts from our partners.</p>
            </CardContent>
          </Card>
        ) : rewardableAttempts.length > 0 ? (
          <Carousel opts={{ align: 'start' }} className="w-full max-w-full">
              <CarouselContent className="-ml-4">
                  {rewardableAttempts.map((attempt, index) => (
                  <CarouselItem key={`${attempt.brand}-${attempt.timestamp}-${index}`} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                      <ScratchCard brand={attempt.brand} slotId={attempt.slotId} timestamp={attempt.timestamp} />
                  </CarouselItem>
                  ))}
              </CarouselContent>
              <CarouselPrevious className="hidden sm:flex" />
              <CarouselNext className="hidden sm:flex" />
          </Carousel>
        ) : (
           <Card className="bg-card/80 border-dashed border-primary/30">
              <CardContent className="p-6 text-center text-muted-foreground">
                  <Gift className="h-10 w-10 mx-auto text-primary/50 mb-4" />
                  <p className="font-semibold text-foreground mb-2">
                      {hasAttempts ? "You've already claimed all available rewards for today!" : "No Brand Gifts Yet"}
                  </p>
                  <p className="text-sm">
                      {hasAttempts ? "Play again in a new slot for more chances to win." : "Play any quiz to unlock a special brand gift!"}
                  </p>
              </CardContent>
            </Card>
        )}
      </section>

      <section className='mt-8'>
        <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
        <div className="space-y-4">
          <GenericOffer title="20% off on Puma Shoes" description="Use code: INDCRIC20" image="https://placehold.co/100x100.png" hint="shoes sport" />
          <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" image="https://placehold.co/100x100.png" hint="food delivery" />
          <GenericOffer title="Buy 1 Get 1 on Pizza Hut" description="Valid on medium pan pizzas" image="https://placehold.co/100x100.png" hint="pizza food" />
        </div>
      </section>
    </>
  );
}
