'use client';

import React from 'react';

// This component is currently disabled to prevent build issues with its dependencies.
export default function GuidedTour({ run, onFinish }: { run: boolean; onFinish: () => void; }) {
  React.useEffect(() => {
    if (run) {
      onFinish();
    }
  }, [run, onFinish]);

  return null;
}
