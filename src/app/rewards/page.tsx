'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift, ExternalLink, Ticket, Percent } from 'lucide-react';
import type { QuizQuestion } from '@/ai/schemas';
import Image from 'next/image';

interface QuizAttempt {
  slotId: string;
  brand: string;
  format: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: string[];
  timestamp: number;
}

const ScratchCard = ({ brand }: { brand: string }) => {
  const [isScratched, setIsScratched] = useState(false);

  const rewardsByBrand: { [key: string]: { gift: string, link: string, image: string, hint: string } } = {
    'Apple': { gift: '10% off on a new iPhone', link: 'https://www.apple.com', image: 'https://placehold.co/300x150.png', hint: 'tech apple' },
    'Myntra': { gift: 'Flat ₹500 off on next purchase', link: 'https://www.myntra.com', image: 'https://placehold.co/300x150.png', hint: 'fashion' },
    'SBI': { gift: '2x Reward Points on credit card', link: 'https://www.onlinesbi.com', image: 'https://placehold.co/300x150.png', hint: 'finance money' },
    'Nike': { gift: '15% off on running shoes', link: 'https://www.nike.com', image: 'https://placehold.co/300x150.png', hint: 'shoes sport' },
    'Amazon': { gift: '₹250 Amazon Pay Balance', link: 'https://www.amazon.in', image: 'https://placehold.co/300x150.png', hint: 'shopping' },
    'boAt': { gift: 'Free airdopes with your next order', link: 'https://www.boat-lifestyle.com', image: 'https://placehold.co/300x150.png', hint: 'headphones music' },
    'Default': { gift: 'A surprise gift from CricBlitz!', link: '#', image: 'https://placehold.co/300x150.png', hint: 'gift box' },
  };

  const reward = rewardsByBrand[brand] || rewardsByBrand['Default'];

  return (
    <Card className="bg-gradient-to-br from-accent to-orange-400 text-accent-foreground p-0 overflow-hidden shadow-lg relative aspect-video">
      {!isScratched ? (
        <div
          className="absolute inset-0 bg-zinc-300 flex flex-col items-center justify-center cursor-pointer transition-opacity hover:opacity-90"
          onClick={() => setIsScratched(true)}
        >
          <p className="font-bold text-zinc-600 text-lg">Scratch to reveal your gift!</p>
          <p className="text-zinc-500">From {brand}</p>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
          <Gift className="h-16 w-16 mb-4 text-white" />
          <h3 className="text-2xl font-bold">{reward.gift}</h3>
          <p className="text-sm opacity-80">from {brand}</p>
          <Button
            onClick={() => window.open(reward.link, '_blank')}
            className="mt-4 bg-white text-accent hover:bg-white/90"
          >
            Claim Now <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </Card>
  );
};


const GenericOffer = ({ title, description, icon: Icon, image, hint }: { title: string, description: string, icon: React.ElementType, image: string, hint: string }) => (
    <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
        <CardContent className="p-4 flex items-center gap-4">
            <Image src={image} alt={title} width={64} height={64} className="rounded-md" data-ai-hint={hint} />
            <div>
                <h4 className="font-bold text-foreground">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
             <Button variant="ghost" size="icon" className="ml-auto">
                <ExternalLink className="text-muted-foreground" />
             </Button>
        </CardContent>
    </Card>
)

export default function RewardsPage() {
  const [latestAttempt, setLatestAttempt] = useState<QuizAttempt | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const historyString = localStorage.getItem('cricblitz-quiz-history');
    if (historyString) {
      try {
        const history: QuizAttempt[] = JSON.parse(historyString);
        if (history.length > 0) {
          const sortedHistory = history.sort((a, b) => b.timestamp - a.timestamp);
          setLatestAttempt(sortedHistory[0]);
        }
      } catch (e) {
        console.error("Failed to parse quiz history", e);
      }
    }
  }, []);

  if (!isClient) {
    return null; // Render nothing on the server to avoid hydration mismatch
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary/80 to-green-300/80 pb-20">
      <header className="p-4 bg-background/50 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">Rewards Center</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-8">
        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Your Brand Gift</h2>
          {latestAttempt ? (
            <ScratchCard brand={latestAttempt.brand} />
          ) : (
            <Card className="bg-background/80 backdrop-blur-sm border-primary/20">
              <CardContent className="p-6 text-center text-muted-foreground">
                <p>Play a quiz to unlock a special brand gift!</p>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-4 text-foreground">Generic Offers</h2>
          <div className="space-y-4">
            <GenericOffer title="20% off on Puma Shoes" description="Use code: CRICBLITZ20" icon={Ticket} image="https://placehold.co/100x100.png" hint="shoes sport" />
            <GenericOffer title="Flat 15% on Swiggy" description="First order for new users" icon={Percent} image="https://placehold.co/100x100.png" hint="food delivery" />
            <GenericOffer title="Buy 1 Get 1 on Pizza Hut" description="Valid on medium pan pizzas" icon={Gift} image="https://placehold.co/100x100.png" hint="pizza food" />
          </div>
        </section>
      </main>
    </div>
  );
}
