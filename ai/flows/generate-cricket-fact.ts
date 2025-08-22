
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
  seenFacts: z.array(z.string()).describe('A list of facts that have already been shown to the user to avoid repetition.'),
});
type GenerateFactsInput = z.infer<typeof GenerateFactsInputSchema>;

const GenerateFactsOutputSchema = z.object({
  facts: z.array(z.string()).length(10).describe('A list of exactly 10 unique, interesting, little-known, and engaging pieces of information about the specified cricket format. These can be a surprising fact, a recent update from your knowledge cutoff, a historical ancedote, or a funny real-life moment.'),
});
type GenerateFactsOutput = z.infer<typeof GenerateFactsOutputSchema>;


export async function generateCricketFacts(input: GenerateFactsInput): Promise<string[]> {
    const { facts } = await generateCricketFactsFlow(input);
    return facts;
}


const prompt = ai.definePrompt({
  name: 'generateCricketFactsPrompt',
  input: { schema: GenerateFactsInputSchema },
  output: { schema: GenerateFactsOutputSchema },
  prompt: `You are a cricket encyclopedia with a witty and engaging personality.
  
  Generate a list of exactly 10 unique, interesting, little-known, and engaging pieces of information about "{{format}}" cricket. Each item can be a surprising fact, a funny real-life moment, a notable update from your knowledge cutoff, or a fascinating historical anecdote.
  
  The content must be strictly about the sport and not mention any brands or sponsors.
  
  Crucially, none of the facts in your response MUST be similar to any of the facts in the following list of already seen facts:
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


const generateCricketFactsFlow = ai.defineFlow(
  {
    name: 'generateCricketFactsFlow',
    inputSchema: GenerateFactsInputSchema,
    outputSchema: GenerateFactsOutputSchema,
  },
  async (input: GenerateFactsInput) => {
    const { output } = await prompt(input);
    if (!output || output.facts.length < 10) {
      // Provide a fallback list if the AI fails
      return { facts: ["Cricket is the second most popular sport in the world.", "The first official international cricket match was played between Canada and the United States in 1844.", "A cricket ball has a circumference of 9 inches.", "The term 'duck' in cricket originated from the shape of the number '0', resembling a duck's egg.", "Sir Don Bradman has a test batting average of 99.94.", "The longest cricket match in history was 9 days long.", "The first-ever cricket World Cup was held in 1975.", "Jim Laker holds the record for taking 19 wickets in a single test match.", "Shahid Afridi holds the record for the fastest ODI century, in just 37 balls.", "Sachin Tendulkar is the only player to have scored 100 international centuries."] };
    }
    return output;
  }
);
