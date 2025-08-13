
'use server';
/**
 * @fileoverview This file initializes the Genkit AI toolkit and configures its plugins.
 * It sets up Firebase, Google AI, and Next.js integration for the application.
 */

import { configureGenkit, genkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { NextJsPlugin } from '@genkit-ai/next';

// This is the global AI object that will be used to define flows, prompts, etc.
// It is exported for use throughout the application.
export const ai = genkit;

// Configure Genkit with the necessary plugins for this application.
configureGenkit({
  plugins: [
    // The Next.js plugin is required for Genkit to work within a Next.js application.
    new NextJsPlugin(),
    
    // The Firebase plugin integrates Genkit with Firebase services,
    // allowing for features like Firestore-based flow state management.
    firebase(),

    // The Google AI plugin provides access to Google's generative models (e.g., Gemini).
    googleAI({
      // Specifying the API version can be important for accessing specific features or models.
      apiVersion: 'v1beta',
    }),
  ],
  
  // Log level for debugging purposes. Can be set to 'info' or 'warn' in production.
  logLevel: 'debug',

  // Enable OpenTelemetry for tracing and metrics, which is useful for monitoring flow performance.
  enableTracingAndMetrics: true,
});
