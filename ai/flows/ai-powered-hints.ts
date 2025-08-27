
'use server';

/**
 * @fileOverview Provides AI-powered hints for quiz questions.
 *
 * This flow generates a contextual hint for a given quiz question, helping the user
 * without giving away the answer directly. It includes robust error handling to provide
 * a helpful fallback hint if the AI generation fails.
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

// The main function exported to the client. It wraps the Genkit flow.
export async function getAIPoweredHint(input: HintInput): Promise<string> {
  const { hint } = await getAIPoweredHintFlow(input);
  return hint;
}

const prompt = ai.definePrompt({
    name: 'getAIPoweredHintPrompt',
    input: { schema: HintInputSchema },
    output: { schema: HintOutputSchema },
    prompt: `
    You are a helpful cricket quiz assistant. Your goal is to provide a single, smart, and indirect hint for the following cricket question.

    The hint MUST NOT give away the correct answer ("{{correctAnswer}}").
    Instead, it should guide the user by providing context, a related fact, or helping them eliminate one or two incorrect options.
    Be creative and encouraging.

    Question: "{{question}}"

    Options:
    {{#each options}}
    - {{this}}
    {{/each}}

    Generate a single, smart hint.
    `,
    config: {
        safetySettings: [
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        ],
        // Adding a retry mechanism for transient errors
        retries: 2, 
    },
});

// Defines the full Genkit flow with robust error handling.
const getAIPoweredHintFlow = ai.defineFlow(
    {
        name: 'getAIPoweredHintFlow',
        inputSchema: HintInputSchema,
        outputSchema: HintOutputSchema,
    },
    async (input) => {
        try {
            // 1. Validate the input to ensure it's not empty.
            if (!input.question || input.options.length === 0) {
                throw new Error("Invalid input: Question or options are empty.");
            }

            // 2. Call the AI prompt.
            const { output } = await prompt(input);
            
            // 3. Validate the AI's output.
            if (!output || !output.hint) {
                 // Throw an error to trigger the catch block for a deterministic fallback.
                throw new Error("AI returned an empty or invalid hint.");
            }

            // 4. Return the successful output.
            return output;
        } catch (error) {
            console.error("Error in getAIPoweredHintFlow, using fallback:", error);
            
            // 5. On any error, return a deterministic and helpful fallback hint.
            // This ensures the user always gets a response.
            return { hint: "Consider the era or the format of cricket the question is about. It might spark a memory!" };
        }
    }
);
