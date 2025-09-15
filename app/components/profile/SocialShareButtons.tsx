
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

const InstagramIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.85s-.011 3.584-.069 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07s-3.584-.012-4.85-.07c-3.252-.148-4.771-1.691-4.919-4.919-.058-1.265-.069-1.645-.069-4.85s.011-3.584.069-4.85c.149-3.225 1.664-4.771 4.919-4.919 1.266-.057 1.644-.069 4.85-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12s.014 3.667.072 4.947c.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24s3.667-.014 4.947-.072c4.358-.2 6.78-2.618 6.98-6.98C23.986 15.667 24 15.259 24 12s-.014-3.667-.072-4.947c-.2-4.358-2.618-6.78-6.98-6.98C15.667.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z"/>
    </svg>
);

const SnapchatIcon = () => (
    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm7.17 14.33c-.22 0-.44-.05-.65-.16-1.12-.55-2.01-1.39-2.58-2.43-.22-.4-.1-.89.3-1.11.4-.22.89-.1 1.11.3.43.8 1.12 1.47 2.02 1.92.4.19.53.69.33 1.09-.16.32-.5.5-.83.5zm-3.23-2.91c-.34-.61-1.25-.91-1.9-.68-.89.31-1.57.99-1.95 1.84-.2.45-.69.64-1.14-.45-.45-.2-.64-.69-.45-1.14.59-1.33 1.73-2.38 3.12-2.8.63-.19 1.29.12 1.48.75.19.63-.12 1.29-.75 1.48h-.01zm-7.6-1.4c-.26 0-.52-.1-.71-.29-.4-.4-.35-.98.02-1.42l4-4.5c.34-.38.9-.42 1.28-.08s.42.9.08 1.28l-4 4.5c-.17.19-.4.29-.67.29zm.01-6c-.55 0-1-.45-1-1s.45-1 1-1h6c.55 0 1 .45 1 1s-.45 1-1 1h-6z"/>
    </svg>
);

const SocialShareButtonsComponent = ({ referralLink }: { referralLink: string }) => {
  const text = "Join me on indcric! It's the ultimate cricket quiz challenge. Use my link to sign up and we both get rewarded when you play!";
  const title = "indcric: The Ultimate Cricket Quiz Challenge!";

  const platforms = [
    { name: 'WhatsApp', icon: <WhatsAppIcon />, url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + referralLink)}` },
    { name: 'Facebook', icon: <FacebookIcon />, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}` },
    { name: 'Telegram', icon: <TelegramIcon />, url: `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}` },
    { name: 'Instagram', icon: <InstagramIcon />, url: 'https://www.instagram.com', tooltip: 'Instagram doesn\'t allow link sharing in posts. Copy the link above and share it in your story or bio!' },
    { name: 'Snapchat', icon: <SnapchatIcon />, url: 'https://www.snapchat.com', tooltip: 'Snapchat doesn\'t allow direct link sharing. Copy the link above and share it in a snap!' },
    { name: 'LinkedIn', icon: <LinkedInIcon />, url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralLink)}&title=${encodeURIComponent(title)}&summary=${encodeURIComponent(text)}` },
  ];

  return (
    <TooltipProvider>
      <div className="flex items-center justify-around gap-2">
        {platforms.map((platform) => (
          <Tooltip key={platform.name} delayDuration={100}>
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
              <p>{platform.tooltip || `Share on ${platform.name}`}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  );
}

export const SocialShareButtons = memo(SocialShareButtonsComponent);
