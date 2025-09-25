
import { genkit } from "@genkit-ai/core";
import { nextjs } from "@genkit-ai/next";
import { firebase } from "@genkit-ai/firebase";
import { googleAI } from '@genkit-ai/googleai';
import { logger } from '@genkit-ai/core';

const isDev = process.env.NODE_ENV === 'development';

if (isDev) {
  logger.setLevel('debug');
} else {
  logger.setLevel('info');
}

export const ai = genkit({
  plugins: [
    googleAI(),
    nextjs(), 
    firebase()
  ],
  enableTracingAndMetrics: isDev,
  logLevel: isDev ? 'debug' : 'info',
});
