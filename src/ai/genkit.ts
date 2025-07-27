
'use server';

import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {firebaseAuth} from '@genkit-ai/firebase';

// This enables Firebase logs and tracing
export const ai = genkit({
  plugins: [
    firebaseAuth(), // The firebaseAuth() plugin enables telemetry and auth.
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
