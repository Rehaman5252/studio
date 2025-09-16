
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, ShoppingBag, Clapperboard, Utensils } from 'lucide-react';
import Image from 'next/image';

const offers = [
    {
        title: '20% Off Myntra',
        description: 'On your next purchase over ₹1500.',
        link: 'https://www.myntra.com/',
        Icon: ShoppingBag,
    },
    {
        title: 'Free Hotstar Subscription',
        description: 'Enjoy 1 month of Hotstar Premium on us.',
        link: 'https://www.hotstar.com/in',
        Icon: Clapperboard,
    },
    {
        title: '₹200 Swiggy Voucher',
        description: 'To satisfy your match-day cravings.',
        link: 'https://www.swiggy.com/',
        Icon: Utensils,
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
                     <div className="bg-secondary p-3 rounded-full">
                        <offer.Icon className="h-6 w-6 text-primary" />
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
                    <ExternalLink className="h-5 w-5" />
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
