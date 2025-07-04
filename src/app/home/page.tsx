'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Clock,
  Users,
  TrendingUp,
  Trophy,
  Flame,
  Star,
  ChevronRight,
} from 'lucide-react';
import Cube from '@/components/Cube';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const brandThemes: { [key: string]: { primary: string; secondary: string; accent: string } } = {
  Apple: { primary: '#000000', secondary: '#F5F5F5', accent: '#007AFF' },
  Myntra: { primary: '#FF3F6C', secondary: '#FFF0F5', accent: '#FF1744' },
  SBI: { primary: '#1E3A8A', secondary: '#EBF8FF', accent: '#3B82F6' },
  Nike: { primary: '#000000', secondary: '#FFFFFF', accent: '#FF6B35' },
  Amazon: { primary: '#FF9900', secondary: '#232F3E', accent: '#FFB74D' },
  Boat: { primary: '#FF6B35', secondary: '#1A1A1A', accent: '#FF8A65' },
};

function NextQuizTimer() {
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const nextQuizMinute = Math.ceil((minutes + 1) / 10) * 10;
      let nextQuizTime = new Date(now);
      nextQuizTime.setMinutes(nextQuizMinute, 0, 0);

      if (nextQuizTime.getMinutes() === minutes) {
          nextQuizTime.setMinutes(nextQuizMinute + 10, 0, 0);
      }

      const diff = nextQuizTime.getTime() - now.getTime();
      const mins = Math.max(0, Math.floor(diff / 60000));
      const secs = Math.max(0, Math.floor((diff % 60000) / 1000));
      setTimeLeft({ minutes: mins, seconds: secs });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (time: number) => time.toString().padStart(2, '0');

  return (
    <span className="font-bold text-2xl text-white">
      {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
    </span>
  );
}

export default function HomeScreen() {
  const [selectedBrand, setSelectedBrand] = useState('Apple');
  const [selectedFormat, setSelectedFormat] = useState('T20');
  const [playersPlaying, setPlayersPlaying] = useState(743);
  const [playersPlayed, setPlayersPlayed] = useState(3029);
  const [totalWinners, setTotalWinners] = useState(129);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlayersPlaying((prev) => Math.max(200, prev + Math.floor(Math.random() * 15) - 7));
      setPlayersPlayed((prev) => prev + Math.floor(Math.random() * 8));
      if (Math.random() > 0.7) {
        setTotalWinners((prev) => prev + Math.floor(Math.random() * 3));
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleFormatSelection = (brand: string, format: string) => {
    setSelectedBrand(brand);
    setSelectedFormat(format);
  };

  const currentTheme = brandThemes[selectedBrand] || brandThemes.Apple;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary to-green-400 text-white">
      <header className="p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight">CricBlitz</h1>
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
          </div>

          <Cube onSelect={handleFormatSelection} />

          <Link href={{ pathname: '/quiz', query: { brand: selectedBrand, format: selectedFormat } }}>
            <Card className="w-full mt-8 rounded-2xl shadow-lg transition-transform hover:scale-105" style={{ backgroundColor: currentTheme.secondary }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold" style={{ color: currentTheme.primary }}>{selectedFormat} Cricket Quiz</h3>
                    <p className="opacity-80 mb-2" style={{ color: currentTheme.primary }}>Sponsored by {selectedBrand}</p>
                    <p className="text-lg font-semibold" style={{ color: currentTheme.accent }}>Win ₹100 + {selectedBrand} Rewards!</p>
                  </div>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: currentTheme.primary }}>
                    <span className="text-3xl">🏏</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
          
          <Separator className="my-8 bg-white/20" />

          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-white/20 border-0">
              <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-accent" />
                <p className="text-sm opacity-80 mb-1">Quiz Ends In</p>
                <NextQuizTimer />
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

          <Link href={{ pathname: '/quiz', query: { brand: selectedBrand, format: selectedFormat } }} className="mt-8 block">
            <Button size="lg" className="w-full h-16 bg-accent hover:bg-accent/90 text-accent-foreground text-xl font-bold shadow-lg">
              Start {selectedFormat} Quiz Now <ChevronRight className="ml-2"/>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
