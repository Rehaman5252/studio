
'use client';

import React, { useState, useCallback, memo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { CubeBrand } from '@/components/home/brandData';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import SelectedBrandCard from '@/components/home/SelectedBrandCard';
import GlobalStats from '@/components/home/GlobalStats';
import StartQuizButton from '@/components/home/StartQuizButton';
import { brands } from './brandData';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from '@/components/ui/carousel';

function QuizSelectionComponent() {
    const { user, isProfileComplete } = useAuth();
    const { lastAttemptInSlot } = useQuizStatus();
    const router = useRouter();

    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);

    const [showSlotPlayedAlert, setShowSlotPlayedAlert] = useState(false);
    const [showAuthAlert, setShowAuthAlert] = useState(false);
    
    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    useEffect(() => {
        if (!api) {
          return
        }
    
        setCurrent(api.selectedScrollSnap())
        setSelectedBrandIndex(api.selectedScrollSnap())
    
        api.on("select", () => {
          const selectedIndex = api.selectedScrollSnap()
          setCurrent(selectedIndex)
          setSelectedBrandIndex(selectedIndex)
        })
    }, [api])

    const handleStartQuiz = useCallback(() => {
        if (!user || !isProfileComplete) {
            setShowAuthAlert(true);
            return;
        }
        if (hasPlayedInCurrentSlot) {
            setShowSlotPlayedAlert(true);
        } else {
            const selectedBrand = brands[selectedBrandIndex];
            router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
        }
    }, [router, user, isProfileComplete, hasPlayedInCurrentSlot, selectedBrandIndex]);

    const handleSlotAlertAction = () => {
        if (lastAttemptInSlot?.reason === 'malpractice') {
            router.push(`/quiz/results?reason=malpractice`);
        } else {
            router.push(`/quiz/results?review=true`);
        }
        setShowSlotPlayedAlert(false);
    };
  
    const handleAuthAlertAction = () => {
        if (!user) {
            router.push('/auth/login');
        } else {
            router.push('/complete-profile');
        }
        setShowAuthAlert(false);
    }
    
    const selectedBrand = brands[selectedBrandIndex];
    
    return (
        <>
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
                <p className="text-sm text-muted-foreground">Use the arrows to navigate the available quizzes!</p>
            </div>
            
            <Carousel setApi={setApi} className="w-full max-w-xs mx-auto">
              <CarouselContent>
                {brands.map((brand, index) => (
                  <CarouselItem key={index}>
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6 bg-primary rounded-lg">
                        <Image
                            src={brand.whiteLogoUrl}
                            alt={`${brand.brand} logo`}
                            data-ai-hint="cricket logo"
                            width={150}
                            height={150}
                            className="object-contain"
                            priority={index === 0}
                        />
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>


            <div className="mt-8 space-y-8">
                <SelectedBrandCard
                  selectedBrand={selectedBrand}
                  handleStartQuiz={handleStartQuiz}
                />
                
                <GlobalStats />

                <StartQuizButton
                  brandFormat={selectedBrand.format}
                  onClick={handleStartQuiz}
                />
            </div>
             <AlertDialog open={showSlotPlayedAlert} onOpenChange={setShowSlotPlayedAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                    {lastAttemptInSlot?.reason === 'malpractice' ? 'Slot Locked' : 'Quiz Already Attempted'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    {lastAttemptInSlot?.reason === 'malpractice'
                        ? "Malpractice was detected in your last attempt for this slot."
                        : "You have already completed a quiz in this slot."
                    }
                    <br/>
                    You can play again in the next slot.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Go Back</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSlotAlertAction}>
                    {lastAttemptInSlot?.reason === 'malpractice' ? 'View Details' : 'View Scorecard'}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            
            <AlertDialog open={showAuthAlert} onOpenChange={setShowAuthAlert}>
                <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>
                    {!user ? 'Login Required' : 'Profile Incomplete'}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                    {!user 
                        ? 'You need to be logged in to play a quiz.' 
                        : 'Please complete your profile to start playing quizzes and earning rewards.'
                    }
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAuthAlertAction}>
                    {!user ? 'Go to Login' : 'Complete Profile'}
                    </AlertDialogAction>
                </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
};

export default memo(QuizSelectionComponent);
