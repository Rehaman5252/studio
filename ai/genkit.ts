
'use server';

import { configureGenkit, logger } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { nextJS } from '@genkit-ai/next';

// Conditionally enable verbose logging, tracing, and metrics only in development.
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  logger.setLevel('debug');
} else {
  logger.setLevel('info');
}

export const ai = configureGenkit({
  plugins: [
    nextJS(),
    firebase(),
    googleAI({ apiVersion: 'v1beta' }),
  ],
  // Tracing and metrics are disabled in production to prevent build failures
  // due to missing optional @opentelemetry packages on Firebase.
  enableTracingAndMetrics: isDev,
});
