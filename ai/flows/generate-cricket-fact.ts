
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
      return { facts: [
        "Shahid Afridi used Sachin Tendulkar’s bat to hit the fastest ODI century (then a record) in 1996, scoring 100 off just 37 balls.",
        "MS Dhoni is so quick behind the stumps that in 2018, he broke his own record for the fastest stumping, dismissing a batsman in just 0.08 seconds!",
        "Irfan Pathan took a hat-trick in the very first over of a Test match against Pakistan in 2006—still the only instance in history.",
        "Sir Don Bradman needed just 4 runs in his last innings to average 100, but was bowled for a duck, ending his career with a 99.94 average.",
        "Adam Gilchrist walked off in a World Cup semi-final (2003) even when the umpire didn’t give him out, a famous act of sportsmanship.",
        "Lasith Malinga is the only bowler to take four wickets in four consecutive balls in international cricket.",
        "In a 2019 Ranji Trophy match, a dog ran onto the field and stopped play for several minutes.",
        "Virender Sehwag is the only player to reach a triple century (300 runs) with a six, and he did it twice!",
        "The longest Test match in history (the “timeless Test” of 1939) lasted for 12 days before ending in a draw.",
        "South Africa’s Herschelle Gibbs is the only player to hit six sixes in an over in a World Cup match (2007)."
      ] };
    }
    return output;
  }
);
