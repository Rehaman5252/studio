'use server';

import { configureGenkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { nextJS } from '@genkit-ai/next';

export const ai = configureGenkit({
  plugins: [
    nextJS(),
    firebase(),
    googleAI({ apiVersion: 'v1beta' }),
  ],
  enableTracingAndMetrics: false,
});
