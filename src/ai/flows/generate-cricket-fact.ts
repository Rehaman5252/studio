
'use server';

/**
 * @fileOverview A flow that generates a single, unique, and interesting cricket fact.
 *
 * - generateCricketFact - A function that generates a fact for a given cricket format.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFactInputSchema = z.object({
  format: z.string().describe('The cricket format (e.g., T20, IPL, Test).'),
  seenFacts: z.array(z.string()).describe('A list of facts that have already been shown to the user to avoid repetition.'),
});
type GenerateFactInput = z.infer<typeof GenerateFactInputSchema>;

const GenerateFactOutputSchema = z.object({
  fact: z.string().describe('A single, interesting, little-known, and engaging fact about the specified cricket format.'),
});
type GenerateFactOutput = z.infer<typeof GenerateFactOutputSchema>;


export async function generateCricketFact(input: GenerateFactInput): Promise<string> {
    const { fact } = await generateCricketFactFlow(input);
    return fact;
}


const prompt = ai.definePrompt({
  name: 'generateCricketFactPrompt',
  input: { schema: GenerateFactInputSchema },
  output: { schema: GenerateFactOutputSchema },
  prompt: `You are a cricket encyclopedia.
  
  Generate a single, interesting, little-known, and engaging fact about the "{{format}}" cricket format.
  
  The fact must be strictly about the sport and not mention any brands or sponsors.
  
  Crucially, the fact MUST NOT be similar to any of the facts in the following list of already seen facts:
  {{#each seenFacts}}
  - "{{this}}"
  {{/each}}
  `,
  config: {
    // Set extremely permissive safety settings to prevent the model from blocking valid responses.
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
});


const generateCricketFactFlow = ai.defineFlow(
  {
    name: 'generateCricketFactFlow',
    inputSchema: GenerateFactInputSchema,
    outputSchema: GenerateFactOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      // Provide a fallback fact if the AI fails
      return { fact: "Cricket is the second most popular sport in the world." };
    }
    return output;
  }
);
