
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingBag, Clapperboard, Utensils, Film, Shirt } from 'lucide-react';
import Image from 'next/image';

const offers = [
    {
        title: '20% Off Myntra',
        description: 'On your next purchase over ₹1500.',
        link: 'https://www.myntra.com/',
        Icon: ShoppingBag,
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Myntra_logo.png',
        logoHint: 'Myntra logo'
    },
    {
        title: 'Free Hotstar Subscription',
        description: 'Enjoy 1 month of Hotstar Premium on us.',
        link: 'https://www.hotstar.com/in',
        Icon: Clapperboard,
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1e/Disney%2B_Hotstar_logo.svg',
        logoHint: 'Hotstar logo'
    },
    {
        title: '₹200 Swiggy Voucher',
        description: 'To satisfy your match-day cravings.',
        link: 'https://www.swiggy.com/',
        Icon: Utensils,
        logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/1/12/Swiggy_logo.svg/1200px-Swiggy_logo.svg.png',
        logoHint: 'Swiggy logo'
    },
    {
        title: '15% Off Puma Gear',
        description: 'On select cricket equipment and apparel.',
        link: 'https://www.puma.com/in',
        Icon: Shirt,
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Puma_logo.svg/1200px-Puma_logo.svg.png',
        logoHint: 'Puma logo'
    },
    {
        title: 'Buy 1 Get 1 on Movie Tickets',
        description: 'With your next BookMyShow booking.',
        link: 'https://in.bookmyshow.com/',
        Icon: Film,
        logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/BookMyShow_logo.svg/1200px-BookMyShow_logo.svg.png',
        logoHint: 'BookMyShow logo'
    },
];

const GenericOffersComponent = () => {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">Commentator's Choice Offers</h2>
      <p className="text-sm text-muted-foreground mb-4">Hand-picked offers for our top players.</p>
      <div className="space-y-3">
        {offers.map((offer, index) => (
          <Card key={index} className="bg-card/80 shadow-md">
            <CardContent className="p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-white rounded-full flex items-center justify-center p-1.5 overflow-hidden">
                        {offer.logoUrl ? (
                            <Image src={offer.logoUrl} alt={`${offer.title} logo`} fill className="object-contain" data-ai-hint={offer.logoHint} />
                        ) : (
                            <offer.Icon className="h-8 w-8 text-primary" />
                        )}
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-base text-foreground">{offer.title}</p>
                        <p className="text-xs text-muted-foreground">{offer.description}</p>
                    </div>
                </div>
                <Button 
                    onClick={() => window.open(offer.link, '_blank')} 
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    aria-label={`Claim offer for ${offer.title}`}
                >
                    <ExternalLink className="h-5 w-5 text-primary" />
                </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

const GenericOffers = memo(GenericOffersComponent);
export default GenericOffers;
