
'use client';

import React, { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Gift, ExternalLink, Loader2 } from 'lucide-react';
import Image from 'next/image';
import type { QuizAttempt } from '@/lib/mockData';
import { useAuth } from '@/context/AuthProvider';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Link from 'next/link';
import { motion } from 'framer-motion';

const ScratchCard = memo(({ brand }: { brand: string }) => {
  const [isScratched, setIsScratched] = useState(false);

  const rewardsByBrand: { [key: string]: { gift: string; description: string; link: string; } } = {
    'indcric': { gift: '₹50 Bonus', description: 'Bonus cash added to your wallet.', link: 'https://www.indcric.com' },
    'Default': { gift: 'Surprise Gift!', description: 'A special reward from indcric.', link: '#' },
    'Apple': { gift: '10% off Accessories', description: 'On your next purchase.', link: '#' },
    'Nike': { gift: 'Free Shipping', description: 'On your next order over ₹2000.', link: '#' },
    'SBI': { gift: '5% Cashback', description: 'On your next 3 transactions.', link: '#' },
    'PayPal': { gift: '₹100 Voucher', description: 'For your next online payment.', link: '#' },
    'WPL': { gift: 'Team Merchandise', description: 'Get a 20% discount coupon.', link: '#' },
    'Amazon': { gift: '₹150 Gift Card', description: 'Credited to your Amazon Pay.', link: '#' },
  };

  const reward = rewardsByBrand[brand] || rewardsByBrand['Default'];

  return (
    <div className="w-full aspect-square p-1">
        <Card className="bg-gradient-to-br from-primary to-yellow-400 text-primary-foreground p-0 overflow-hidden shadow-lg relative w-full h-full rounded-2xl">
        {!isScratched ? (
            <motion.button
              className="absolute inset-0 bg-zinc-300 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-90 rounded-2xl p-2 text-center"
              onClick={() => setIsScratched(true)}
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
              <Gift className="h-10 w-10 mb-2 text-white" />
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

const BrandGiftsSection = memo(({ uniqueBrandAttempts }: { uniqueBrandAttempts: { brand: string }[] }) => (
  <section>
    <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
    <p className="text-sm text-muted-foreground mb-4">You've earned a unique gift from each brand you've played with. Scratch to reveal!</p>
    
    {uniqueBrandAttempts.length > 0 ? (
      <Carousel
          opts={{
              align: 'start',
          }}
          className="w-full max-w-full"
      >
          <CarouselContent className="-ml-4">
              {uniqueBrandAttempts.map((attempt) => (
              <CarouselItem key={attempt.brand} className="pl-4 basis-1/2 sm:basis-1/3 md:basis-1/4">
                  <ScratchCard brand={attempt.brand} />
              </CarouselItem>
              ))}
          </CarouselContent>
          <CarouselPrevious className="hidden sm:flex" />
          <CarouselNext className="hidden sm:flex" />
      </Carousel>
    ) : (
      <Card className="bg-card/80">
        <CardContent className="p-6 text-center text-muted-foreground">
          <p>Play a quiz to unlock a special brand gift!</p>
        </CardContent>
      </Card>
    )}
  </section>
));
BrandGiftsSection.displayName = 'BrandGiftsSection';

const GenericOffersSection = memo(() => (
  <section>
    <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
    <div className="space-y-4">
      <GenericOffer title="20% off on Puma Shoes" description="Use code: INDCRIC20" image="https://placehold.co/100x100.png" hint="shoes sport" />
      <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" image="https://placehold.co/100x100.png" hint="food delivery" />
      <GenericOffer title="Buy 1 Get 1 on Pizza Hut" description="Valid on medium pan pizzas" image="https://placehold.co/100x100.png" hint="pizza food" />
    </div>
  </section>
));
GenericOffersSection.displayName = 'GenericOffersSection';

export default function RewardsContent() {
  const { user, quizHistory, isHistoryLoading } = useAuth();
  
  const uniqueBrandAttempts = useMemo(() => {
    const localHistory = (quizHistory as QuizAttempt[]) || [];
    const seenBrands = new Set<string>();
    return localHistory.filter(attempt => {
        if (!attempt.brand || seenBrands.has(attempt.brand)) {
            return false;
        } else {
            seenBrands.add(attempt.brand);
            return true;
        }
    });
  }, [quizHistory]);


  return (
    <>
        {!user && (
            <Card className="bg-card/80 border-primary/20 shadow-lg">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Gift className="text-primary" />
                        Enter the Winner's Circle
                    </CardTitle>
                    <CardDescription>
                        Sign in to claim special "Man of the Match" awards from our sponsors for every quiz format you conquer!
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <Button asChild className="w-full">
                        <Link href="/auth/login">Sign In to Unlock Rewards</Link>
                    </Button>
                </CardContent>
            </Card>
        )}

        {user && (
            isHistoryLoading ? (
                 <section>
                    <h2 className="text-xl font-semibold text-foreground">Your Brand Gifts</h2>
                    <div className="w-full flex justify-center items-center h-40">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                </section>
            ) : (
                <BrandGiftsSection uniqueBrandAttempts={uniqueBrandAttempts} />
            )
        )}
        
        <GenericOffersSection />
    </>
  );
}
