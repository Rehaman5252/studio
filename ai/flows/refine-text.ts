
'use server';

/**
 * @fileOverview A flow that refines user-submitted text for grammar, spelling, and clarity.
 *
 * This flow does not generate content; it only polishes existing text.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const RefineTextInputSchema = z.object({
  text: z.string().describe('The user-submitted text to be refined.'),
});
type RefineTextInput = z.infer<typeof RefineTextInputSchema>;

const RefineTextOutputSchema = z.object({
    refinedText: z.string().describe('The polished version of the text with corrected grammar, spelling, and improved phrasing.'),
});
type RefineTextOutput = z.infer<typeof RefineTextOutputSchema>;

export async function refineText(input: RefineTextInput): Promise<string> {
  const { refinedText } = await refineTextFlow(input);
  return refinedText;
}

const prompt = ai.definePrompt({
    name: 'refineTextPrompt',
    input: { schema: RefineTextInputSchema },
    output: { schema: RefineTextOutputSchema },
    prompt: `
    You are an expert editor. Your task is to refine the following text.
    
    Correct any spelling mistakes, fix grammatical errors, and improve the overall phrasing for clarity and impact.
    
    IMPORTANT: Do NOT change the core meaning or add any new information. Only polish the existing text. Return only the refined text.

    Original Text: "{{text}}"
    `,
});

const refineTextFlow = ai.defineFlow(
    {
        name: 'refineTextFlow',
        inputSchema: RefineTextInputSchema,
        outputSchema: RefineTextOutputSchema,
    },
    async (input) => {
        const { output } = await prompt(input);
        if (!output) {
            // In case of failure, return the original text
            return { refinedText: input.text };
        }
        return output;
    }
);
