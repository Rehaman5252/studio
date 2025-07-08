'use client';

import { useEffect } from 'react';
import CricketLoading from '@/components/CricketLoading';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <CricketLoading 
        state="error"
        errorMessage="It's a wicket! Something went wrong with the quiz."
    >
       <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
      >
        Try Again
      </Button>
    </CricketLoading>
  );
}
