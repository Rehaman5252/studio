'use server';

import { configureGenkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { nextJS } from '@genkit-ai/next';

// Conditionally enable tracing and metrics only in development.
const isDev = process.env.NODE_ENV === 'development';

export const ai = configureGenkit({
  plugins: [
    nextJS(),
    firebase(),
    googleAI({ apiVersion: 'v1beta' }),
  ],
  // This will be true in development and false in production.
  enableTracingAndMetrics: isDev,
});
