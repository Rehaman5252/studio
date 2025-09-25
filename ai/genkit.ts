
import { genkit } from "@genkit-ai/core";
import { nextjs } from "@genkit-ai/next";
import { firebase } from "@genkit-ai/firebase";
import { googleAI } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI(), nextjs(), firebase()],
  enableTracingAndMetrics: false,
});
