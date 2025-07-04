// 'use server';

/**
 * @fileOverview A flow that generates AI-powered hints for quiz questions.
 *
 * - generateHint - A function that generates a hint for a given quiz question.
 * - GenerateHintInput - The input type for the generateHint function.
 * - GenerateHintOutput - The return type for the generateHint function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateHintInputSchema = z.object({
  question: z.string().describe('The quiz question to generate a hint for.'),
  format: z.string().describe('The quiz format (e.g., T20, ODI, Test).'),
  brand: z.string().describe('The brand associated with the quiz.'),
});

export type GenerateHintInput = z.infer<typeof GenerateHintInputSchema>;

const GenerateHintOutputSchema = z.object({
  hint: z.string().describe('A helpful hint for the quiz question.'),
});

export type GenerateHintOutput = z.infer<typeof GenerateHintOutputSchema>;

export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: {schema: GenerateHintInputSchema},
  output: {schema: GenerateHintOutputSchema},
  prompt: `You are an AI assistant designed to provide helpful hints for a cricket quiz.

  Given the following quiz question, format, and brand, generate a concise and relevant hint that guides the user towards the correct answer without giving it away directly.

  Question: {{{question}}}
  Format: {{{format}}}
  Brand: {{{brand}}}

  Ensure the hint is specific to the question and considers the format and brand when applicable.
  `,
});

const generateHintFlow = ai.defineFlow(
  {
    name: 'generateHintFlow',
    inputSchema: GenerateHintInputSchema,
    outputSchema: GenerateHintOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
