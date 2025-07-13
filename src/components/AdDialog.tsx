
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SkipForward, Volume2, VolumeX } from 'lucide-react';
import Image from 'next/image';

interface AdDialogProps {
  open: boolean;
  onAdFinished: () => void;
  duration: number; // in seconds
  skippableAfter: number; // in seconds
  adTitle: string;
  adType: 'image' | 'video';
  adUrl: string;
  children?: React.ReactNode;
  adHint?: string; // for data-ai-hint on images
}

export function AdDialog({ open, onAdFinished, duration, skippableAfter, adTitle, adType, adUrl, adHint, children }: AdDialogProps) {
  const [adTimeLeft, setAdTimeLeft] = useState(duration);
  const [isSkippable, setIsSkippable] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Mute by default
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!open) return;

    // Reset state for new ad
    setAdTimeLeft(duration);
    setIsSkippable(false);

    if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play().catch(error => console.error("Video autoplay was prevented:", error));
    }

    const timer = setInterval(() => {
      setAdTimeLeft((prev) => {
        const newTime = prev - 1;
        if (newTime <= duration - skippableAfter) {
            setIsSkippable(true);
        }
        if (newTime <= 0) {
          clearInterval(timer);
          if (adType === 'image') {
            onAdFinished();
          }
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [open, duration, skippableAfter, adType, onAdFinished]);

  const handleVideoEnd = () => {
    onAdFinished();
  };
  
  const handleSkip = () => {
      if (videoRef.current) {
          videoRef.current.pause();
      }
      onAdFinished();
  }

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        // Prevent closing via overlay click unless skippable
        if (!isOpen && isSkippable) {
            handleSkip();
        }
    }}>
        <DialogContent
            className="bg-background text-foreground p-0 max-w-sm"
            onInteractOutside={(e) => {
                 if (!isSkippable) e.preventDefault();
            }}
            onEscapeKeyDown={(e) => {
                if (!isSkippable) {
                    e.preventDefault();
                } else {
                    handleSkip();
                }
            }}
        >
            <DialogHeader className="p-4 border-b">
                <DialogTitle>{adTitle}</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2 text-center">
                 <div className="relative aspect-video bg-black rounded-md flex items-center justify-center">
                    {adType === 'video' ? (
                        <>
                            <video
                                ref={videoRef}
                                src={adUrl}
                                muted={isMuted}
                                onEnded={handleVideoEnd}
                                className="w-full h-full object-cover rounded-md"
                                playsInline
                                autoPlay
                                title={adTitle}
                            />
                            <Button variant="ghost" size="icon" className="absolute bottom-2 right-2 bg-black/50 hover:bg-black/70 text-white" onClick={() => setIsMuted(prev => !prev)} aria-label={isMuted ? "Unmute video" : "Mute video"}>
                                {isMuted ? <VolumeX /> : <Volume2 />}
                            </Button>
                        </>
                    ) : (
                         <Image src={adUrl} alt="Advertisement" fill={true} className="object-contain rounded-md" data-ai-hint={adHint || 'advertisement'} />
                    )}
                </div>
                {children}
                <div className="mt-4 flex justify-between items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">
                        {adType === 'video' ? 'Ad' : `Ad will close in ${adTimeLeft}s`}
                    </span>
                    {isSkippable ? (
                        <Button onClick={handleSkip} size="sm" className="h-auto py-1 whitespace-normal">
                            <SkipForward className="mr-2 h-4 w-4"/> Skip Ad
                        </Button>
                    ) : (
                         <Button disabled size="sm" className="h-auto py-1 whitespace-normal text-right">
                           {`Skip in ${adTimeLeft - (duration - skippableAfter)}s`}
                        </Button>
                    )}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}
