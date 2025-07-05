
'use client';

import React, { useState, useMemo, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Gift, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import { mockQuizHistory } from '@/lib/mockData';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

const ScratchCard = memo(({ brand }: { brand: string }) => {
  const [isScratched, setIsScratched] = useState(false);

  const rewardsByBrand: { [key: string]: { gift: string; description: string; link: string; } } = {
    'Apple': { gift: '10% off new iPhone', description: 'Save on your next Apple purchase.', link: 'https://www.apple.com' },
    'Myntra': { gift: 'Flat ₹500 off', description: 'On your next Myntra order.', link: 'https://www.myntra.com' },
    'SBI': { gift: '2x Reward Points', description: 'On your SBI credit card.', link: 'https://www.onlinesbi.com' },
    'Nike': { gift: '15% off running shoes', description: 'Step up your game with Nike.', link: 'https://www.nike.com' },
    'Amazon': { gift: '₹250 Amazon Pay', description: 'Added to your wallet.', link: 'https://www.amazon.in' },
    'boAt': { gift: 'Free Airdopes', description: 'With your next boAt order.', link: 'https://www.boat-lifestyle.com' },
    'Default': { gift: 'Surprise Gift!', description: 'A special reward from Indcric.', link: '#' },
  };

  const reward = rewardsByBrand[brand] || rewardsByBrand['Default'];

  return (
    <div className="w-full aspect-square p-1">
        <Card className="bg-gradient-to-br from-primary to-yellow-400 text-primary-foreground p-0 overflow-hidden shadow-lg relative w-full h-full rounded-2xl">
        {!isScratched ? (
            <button
              className="absolute inset-0 bg-zinc-300 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-90 rounded-2xl p-2 text-center"
              onClick={() => setIsScratched(true)}
              role="button"
              aria-label={`Scratch to reveal gift from ${brand}`}
            >
              <p className="font-bold text-zinc-600 text-lg">Scratch to reveal!</p>
              <p className="text-zinc-500 text-sm">From {brand}</p>
            </button>
        ) : (
            <div 
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
            </div>
        )}
        </Card>
    </div>
  );
});
ScratchCard.displayName = 'ScratchCard';


const GenericOffer = memo(({ title, description, image, hint }: { title: string, description: string, image: string, hint: string }) => (
    <div className="transition-transform hover:scale-103">
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
    </div>
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

  const uniqueBrandAttempts = useMemo(() => {
    const seenBrands = new Set<string>();
    return mockQuizHistory.filter(attempt => {
        if (seenBrands.has(attempt.brand) || !attempt.brand) {
            return false;
        } else {
            seenBrands.add(attempt.brand);
            return true;
        }
    });
  }, []);

  return (
    <>
        <BrandGiftsSection uniqueBrandAttempts={uniqueBrandAttempts} />
        <GenericOffersSection />
    </>
  );
}
