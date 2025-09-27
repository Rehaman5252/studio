
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { genericOffers } from '@/app/lib/rewards-config';

const GenericOffersComponent = () => {

  return (
    <section className="mt-8">
      <h2 className="text-xl font-semibold text-foreground">Commentator's Choice Offers</h2>
      <p className="text-sm text-muted-foreground mb-4">Hand-picked offers for our top players.</p>
      <div className="space-y-3">
        {genericOffers.map((offer) => (
          <Card key={offer.id} className="bg-card/80 shadow-md">
            <CardContent className="p-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-secondary rounded-full flex items-center justify-center p-1.5 overflow-hidden">
                        <offer.Icon className="h-8 w-8 text-primary" />
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
