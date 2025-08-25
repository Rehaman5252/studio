
'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// SVG icons for social media brands
const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M12.04 2.01A9.99 9.99 0 002.05 12a9.99 9.99 0 0011.53 9.47l3.41-1.01-1.01 3.41A9.99 9.99 0 0022 12c0-5.52-4.48-10-10-10h-.01zM12 20.01c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm2.68-6.07c-.12-.06-1.55-.77-1.79-.85-.24-.08-.42-.12-.59.12-.17.24-.68.85-.83 1.02s-.3.18-.55.06c-.25-.12-1.06-.39-2.02-1.25-.75-.67-1.25-1.5-1.4-1.75s-.02-.37.1-0.48c.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.15.04-.28-.02-.38-.06-.1-.59-1.42-1.63-2.92-.45-.64-.91-.55-1.24-.56-.3-.01-.64-.01-.97-.01s-.8.12-1.24.59c-.44.47-1.68 1.64-1.68 4.02s1.72 4.67 1.96 4.99.34.42.55.59c.21.17.68.27 1.02.43.34.16.6.24.93.38.33.14.59.2.85.3.26.1.5.15.68.09.2-.06.88-.36 1.1-.7.22-.34.22-.64.16-.7s-.24-.28-.36-.42c-.12-.14-.24-.22-.3-.28-.06-.06-.12-.12-.18-.18s-.11-.1-.17-.18c-.06-.08-.12-.18-.18-.28s-.1-.18-.04-.34c.06-.16.3-.43.53-.67.23-.24.47-.4.6-.53.13-.13.22-.22.3-.28.08-.06.18-.12.28-.18.1-.06.18-.04.24 0 .06.04.28.13.48.25.2.12.36.18.5.24.14.06.28.1.4.04.14-.06.22-.3.34-.48.12-.18.24-.36.36-.55.12-.19.24-.3.3-.4.06-.1.03-.2 0-.25z"/>
  </svg>
);

const TelegramIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.69 6.54l-1.44 6.72c-.12.55-.44.69-.87.43l-2.21-1.63-1.06 1.02c-.12.12-.22.22-.44.22l.16-2.26 4.14-3.75c.18-.16-.04-.25-.29-.09L8.24 13.91l-2.18-.68c-.55-.17-.55-.54.11-.81l8.93-3.44c.47-.18.89.12.73.76z"/>
    </svg>
);

const LinkedInIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
    </svg>
);

const SocialShareButtonsComponent = ({ referralLink }: { referralLink: string }) => {
  const text = "Join me on indcric! It's the ultimate cricket quiz challenge. Use my link to sign up and we both get rewarded when you play!";
  const title = "indcric: Win ₹100 for every 100 seconds!";

  const platforms = [
    { name: 'WhatsApp', icon: <WhatsAppIcon />, url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}` },
    { name: 'Facebook', icon: <FacebookIcon />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}` },
    { name: 'Telegram', icon: <TelegramIcon />, url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}` },
    { name: 'LinkedIn', icon: <LinkedInIcon />, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}` },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-around gap-2">
        {platforms.map((platform) => (
          <Tooltip key={platform.name}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="rounded-full"
                onClick={() => window.open(platform.url, '_blank', 'noopener,noreferrer')}
                aria-label={`Share on ${platform.name}`}
              >
                {platform.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{`Share on ${platform.name}`}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export const SocialShareButtons = memo(SocialShareButtonsComponent);
