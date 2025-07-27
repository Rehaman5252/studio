
'use server';

import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase';

// This enables Firebase logs and tracing
export const ai = genkit({
  plugins: [
    firebase(), // The firebase() plugin enables telemetry and auth.
    googleAI(),
  ],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});
