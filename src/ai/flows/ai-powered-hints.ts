
'use server';

/**
 * @fileOverview Provides AI-powered hints for quiz questions.
 *
 * This flow generates a contextual hint for a given quiz question, helping the user
 * without giving away the answer directly.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const HintInputSchema = z.object({
  question: z.string().describe('The full text of the quiz question.'),
  options: z.array(z.string()).describe('The multiple-choice options for the question.'),
  correctAnswer: z.string().describe('The correct answer to the question.'),
});
type HintInput = z.infer<typeof HintInputSchema>;

const HintOutputSchema = z.object({
    hint: z.string().describe('A clever, contextual clue that helps the user think about the question differently or eliminate some options, without directly revealing the correct answer.'),
});
type HintOutput = z.infer<typeof HintOutputSchema>;

export async function getAIPoweredHint(input: HintInput): Promise<string> {
  const { hint } = await getAIPoweredHintFlow(input);
  return hint;
}

const prompt = ai.definePrompt({
    name: 'getAIPoweredHintPrompt',
    input: { schema: HintInputSchema },
    output: { schema: HintOutputSchema },
    prompt: `
    You are a clever cricket quizmaster. Your goal is to provide a helpful but indirect hint for the following cricket question.

    The hint should not give away the correct answer ("{{correctAnswer}}"). Instead, it should guide the user towards the right line of thinking or help them eliminate one or two incorrect options. Be creative and witty.

    Question: "{{question}}"

    Options:
    {{#each options}}
    - {{this}}
    {{/each}}

    Generate a single, smart hint.
    `,
    config: {
        // More restrictive safety settings are fine here
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
    },
});

const getAIPoweredHintFlow = ai.defineFlow(
    {
        name: 'getAIPoweredHintFlow',
        inputSchema: HintInputSchema,
        outputSchema: HintOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            return { hint: "Think about the era when this player was active. That might help narrow it down!" };
        }
        return output;
    }
);
