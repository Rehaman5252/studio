import {genkit} from '@genkit-ai/core';
import {googleAI} from '@genkit-ai/googleai';
import {firebase} from '@genkit-ai/firebase/plugin';

export const ai = genkit({
  plugins: [firebase(), googleAI()],
  model: 'googleai/gemini-2.0-flash',
});
