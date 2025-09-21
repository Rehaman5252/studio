
'use server';

import { configureGenkit, logger } from '@genkit-ai/core';
import { firebase as firebasePlugin } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { nextJS as nextjsPlugin } from '@genkit-ai/next';

// Conditionally enable verbose logging, tracing, and metrics only in development.
const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  logger.setLevel('debug');
} else {
  logger.setLevel('info');
}

export const ai = configureGenkit({
  plugins: [
    nextjsPlugin(),
    firebasePlugin(),
    googleAI({ apiVersion: 'v1beta' }),
  ],
  enableTracingAndMetrics: isDev,
});
