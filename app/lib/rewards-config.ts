
'use client';

import type { LucideIcon } from 'lucide-react';
import { ShoppingBag, Clapperboard, Utensils, Film, Shirt } from 'lucide-react';

export interface GenericOffer {
  id: string;
  title: string;
  description: string;
  Icon: LucideIcon;
  link: string;
}

export const genericOffers: GenericOffer[] = [
    {
        id: 'myntra_offer',
        title: '20% Off Myntra',
        description: 'On your next purchase over ₹1500.',
        link: 'https://www.myntra.com/',
        Icon: ShoppingBag,
    },
    {
        id: 'hotstar_offer',
        title: 'Free Hotstar Subscription',
        description: 'Enjoy 1 month of Hotstar Premium on us.',
        link: 'https://www.hotstar.com/in',
        Icon: Clapperboard,
    },
    {
        id: 'swiggy_offer',
        title: '₹200 Swiggy Voucher',
        description: 'To satisfy your match-day cravings.',
        link: 'https://www.swiggy.com/',
        Icon: Utensils,
    },
    {
        id: 'puma_offer',
        title: '15% Off Puma Gear',
        description: 'On select cricket equipment and apparel.',
        link: 'https://www.puma.com/in',
        Icon: Shirt,
    },
    {
        id: 'bms_offer',
        title: 'Buy 1 Get 1 on Movie Tickets',
        description: 'With your next BookMyShow booking.',
        link: 'https://in.bookmyshow.com/',
        Icon: Film,
    },
];
