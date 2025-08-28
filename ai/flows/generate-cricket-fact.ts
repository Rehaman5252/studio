
'use server';

/**
 * @fileOverview A flow that generates a list of unique and interesting cricket facts, updates, or anecdotes.
 *
 * - generateCricketFacts - A function that generates a list of content for a given cricket format.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';

const GenerateFactsInputSchema = z.object({
  format: z.string().describe('The cricket format (e.g., T20, IPL, Test).'),
  count: z.number().int().positive().default(5).describe('The number of facts to generate.'),
  seenFacts: z.array(z.string()).optional().describe('A list of facts that have already been shown to the user to avoid repetition.'),
});
type GenerateFactsInput = z.infer<typeof GenerateFactsInputSchema>;

const GenerateFactsOutputSchema = z.object({
  facts: z.array(z.string()).describe('A list of unique, interesting, little-known, and engaging pieces of information about the specified cricket format. These can be a surprising fact, a recent update from your knowledge cutoff, a historical ancedote, or a funny real-life moment.'),
});
type GenerateFactsOutput = z.infer<typeof GenerateFactsOutputSchema>;


export async function generateCricketFacts(input: GenerateFactsInput): Promise<string[]> {
    const { facts } = await generateCricketFactsFlow(input);
    return facts;
}

const getFallbackFacts = (): string[] => [
    "The term 'Googly' was named after its inventor, Bernard Bosanquet.",
    "The longest Test match in history lasted for 12 days.",
    "Shahid Afridi once hit the fastest ODI century using Sachin Tendulkar's bat.",
    "Sir Don Bradman needed only 4 runs in his last innings to have a Test average of 100, but was out for a duck.",
    "In 2003, Adam Gilchrist famously 'walked' in a World Cup semi-final despite being given not out."
];


const prompt = ai.definePrompt({
  name: 'generateCricketFactsPrompt',
  input: { schema: GenerateFactsInputSchema },
  output: { schema: GenerateFactsOutputSchema },
  prompt: `You are a cricket encyclopedia with a witty and engaging personality.
  
  Generate a list of exactly {{count}} unique, interesting, little-known, and engaging pieces of information about "{{format}}" cricket. Each item can be a surprising fact, a funny real-life moment, a notable update from your knowledge cutoff, or a fascinating historical anecdote.
  
  The content must be strictly about the sport and not mention any brands or sponsors.
  The facts must not be direct answers to common quiz questions.

  Crucially, none of the facts in your response MUST be similar to any of the facts in the following list of already seen facts:
  {{#if seenFacts}}
    {{#each seenFacts}}
    - "{{this}}"
    {{/each}}
  {{/if}}
  `,
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
});


const generateCricketFactsFlow = ai.defineFlow(
  {
    name: 'generateCricketFactsFlow',
    inputSchema: GenerateFactsInputSchema,
    outputSchema: GenerateFactsOutputSchema,
  },
  async (input: GenerateFactsInput) => {
    try {
        const { output } = await prompt(input);
        if (!output || output.facts.length < input.count) {
          throw new Error("AI returned fewer facts than requested.");
        }
        return output;
    } catch (error) {
        console.warn("AI fact generation failed, using fallback.", error);
        return { facts: getFallbackFacts() };
    }
  }
);
