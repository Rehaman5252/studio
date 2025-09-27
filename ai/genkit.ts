
'use server';
/**
 * @fileOverview Genkit AI configuration.
 *
 * This file sets up and newup the Genkit AI instance for the application,
 * ensuring it's ready for use in server-side Next.js environments.
 */

import { genkit, configureGenkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { logger } from 'genkit/logging';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  logger.setLevel('debug');
} else {
  logger.setLevel('info');
}

// Configure Genkit
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_API_KEY,
    }),
  ],
  // Tracing and metrics are disabled in production to prevent build failures
  // due to missing optional @opentelemetry packages on Firebase.
  enableTracingAndMetrics: isDev,
});
