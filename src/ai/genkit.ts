import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {enableFirebaseTelemetry} from '@genkit-ai/firebase';

// This enables Firebase logs and tracing
enableFirebaseTelemetry();

export const ai = genkit({
  plugins: [
    googleAI(),
    // no need to include firebase() plugin in the array!
  ],
});
