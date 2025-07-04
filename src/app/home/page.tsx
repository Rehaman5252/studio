
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Users,
  TrendingUp,
  Trophy,
  Flame,
  Star,
  ChevronRight,
} from 'lucide-react';
import Cube, { type CubeBrand } from '@/components/Cube';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useQuizStatus } from '@/context/QuizStatusProvider';

const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/480px-Apple_logo_black.svg.png', logoWidth: 40, logoHeight: 48 },
  { id: 2, brand: 'Myntra', format: 'WPL', logoUrl: 'https://assets.stickpng.com/images/580b57fcd9996e24bc43c521.png', logoWidth: 90, logoHeight: 25 },
  { id: 3, brand: 'SBI', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/1024px-SBI-logo.svg.png', logoWidth: 60, logoHeight: 60 },
  { id: 4, brand: 'Nike', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png', logoWidth: 80, logoHeight: 30 },
  { id: 5, brand: 'Amazon', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png', logoWidth: 70, logoHeight: 25 },
  { id: 6, brand: 'boAt', format: 'IPL', logoUrl: 'https://cdn.shopify.com/s/files/1/0057/8938/4802/files/boat_logo_small.png?v=1682573254', logoWidth: 80, logoHeight: 25 },
];

const formatTime = (time: number) => time.toString().padStart(2, '0');

export default function HomeScreen() {
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const { timeLeft, playersPlaying, playersPlayed, totalWinners } = useQuizStatus();
  const router = useRouter();

  const handleBrandSelect = useCallback((index: number) => {
    setSelectedBrandIndex(index);
  }, []);

  const selectedBrand = brands[selectedBrandIndex];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary to-green-400 text-white">
      <header className="p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">Indcric</h1>
          <p className="text-sm opacity-90">Win ₹100 for 100 Seconds</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="bg-white/20 border-0 text-center">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Flame className="h-6 w-6 text-accent" />
                <span className="text-xl font-bold mt-2">7</span>
                <span className="text-xs opacity-80">Day Streak</span>
              </CardContent>
            </Card>
            <Card className="bg-white/20 border-0 text-center">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Trophy className="h-6 w-6 text-yellow-400" />
                <span className="text-xl font-bold mt-2">₹500</span>
                <span className="text-xs opacity-80">Won</span>
              </CardContent>
            </Card>
            <Card className="bg-white/20 border-0 text-center">
              <CardContent className="p-4 flex flex-col items-center justify-center">
                <Star className="h-6 w-6 text-yellow-400" />
                <span className="text-xl font-bold mt-2">4.8</span>
                <span className="text-xs opacity-80">Best Score</span>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Select Your Cricket Format to Win</h2>
            <p className="text-sm opacity-80">Click a face on the cube to start!</p>
          </div>

          <Cube brands={brands} onSelect={handleBrandSelect} />
          
          <Card key={selectedBrand.id} className="w-full mt-8 rounded-2xl shadow-lg bg-white/20 border-0 animate-in fade-in duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedBrand.format} Cricket Quiz</h3>
                  <p className="opacity-80 mb-2 text-white">Sponsored by {selectedBrand.brand}</p>
                  <p className="text-lg font-semibold text-white">Win ₹100 + {selectedBrand.brand} Rewards!</p>
                </div>
                <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white/30 p-2">
                  <Image
                    src={selectedBrand.logoUrl}
                    alt={`${selectedBrand.brand} logo`}
                    width={selectedBrand.logoWidth < 50 ? selectedBrand.logoWidth * 1.2 : selectedBrand.logoWidth}
                    height={selectedBrand.logoHeight < 50 ? selectedBrand.logoHeight * 1.2 : selectedBrand.logoHeight}
                    className="object-contain"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Separator className="my-8 bg-white/20" />

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/20 border-0">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-accent" />
                <p className="text-sm opacity-80 mb-1">Quiz Ends In</p>
                <span className="font-bold text-2xl text-white">
                  {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
                </span>
              </CardContent>
            </Card>
            <Card className="bg-white/20 border-0">
              <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-yellow-400" />
                <p className="text-sm opacity-80 mb-1">Players Playing</p>
                <p className="text-2xl font-bold">{playersPlaying.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/20 border-0">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-300" />
                <p className="text-sm opacity-80 mb-1">Players Played</p>
                <p className="text-2xl font-bold">{playersPlayed.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/20 border-0">
              <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-purple-400" />
                <p className="text-sm opacity-80 mb-1">Total Winners</p>
                <p className="text-2xl font-bold">{totalWinners.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>
          <Button
            size="lg"
            className="w-full mt-8 bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-7"
            onClick={() => router.push(`/quiz?brand=${selectedBrand.brand}&format=${selectedBrand.format}`)}
          >
            Start {selectedBrand.format} Quiz
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </main>
    </div>
  );
}
