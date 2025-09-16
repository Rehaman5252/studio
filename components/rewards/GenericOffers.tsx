'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gift, ExternalLink } from 'lucide-react';

const offers = [
    {
        title: '20% Off Myntra',
        description: 'Get 20% off on your next purchase over ₹1500.',
        link: 'https://www.myntra.com/',
    },
    {
        title: 'Free Hotstar Subscription',
        description: 'Enjoy 1 month of Hotstar Premium on us to watch live cricket.',
        link: 'https://www.hotstar.com/in',
    },
    {
        title: '₹200 Swiggy Voucher',
        description: 'A voucher to satisfy your match-day cravings.',
        link: 'https://www.swiggy.com/',
    },
];

const GenericOffersComponent = () => {
  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">Commentator's Choice Offers</h2>
      <p className="text-sm text-muted-foreground mb-4">Hand-picked offers for our top players.</p>
      <div className="space-y-4">
        {offers.map((offer, index) => (
          <Card key={index} className="bg-card/80 shadow-md">
            <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-2">
                <Gift className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle className="text-base">{offer.title}</CardTitle>
                    <CardDescription>{offer.description}</CardDescription>
                </div>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => window.open(offer.link, '_blank')} 
                className="w-full"
                variant="secondary"
              >
                Claim Offer <ExternalLink className="ml-2 h-4 w-4" />
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
