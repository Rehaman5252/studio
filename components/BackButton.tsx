
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

export default function BackButton() {
  const router = useRouter();

  return (
    <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
      <ChevronLeft className="h-6 w-6" />
      <span className="sr-only">Go back</span>
    </Button>
  );
}
