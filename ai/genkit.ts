
import { createGenkit } from "@genkit-ai/next"; // Correct package for Genkit v1.10.0

export const genkit = createGenkit({
  apiKey: process.env.GENKIT_API_KEY,
  defaultModel: "gpt-5",
  tracing: process.env.NODE_ENV !== "production",
  metrics: process.env.NODE_ENV !== "production",
});

export const { defineFlow, ai } = genkit;
