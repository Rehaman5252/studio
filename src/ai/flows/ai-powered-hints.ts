'use server';

/**
 * @fileOverview A flow that generates AI-powered hints for quiz questions.
 *
 * - generateHint - A function that generates a hint for a given quiz question.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateHintInput,
    GenerateHintOutput,
    GenerateHintInputSchema,
    GenerateHintOutputSchema
} from '@/ai/schemas';


export async function generateHint(input: GenerateHintInput): Promise<GenerateHintOutput> {
  return generateHintFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateHintPrompt',
  input: {schema: GenerateHintInputSchema},
  output: {schema: GenerateHintOutputSchema},
  prompt: `You are an AI assistant designed to provide helpful hints for a cricket quiz.

  Given the following quiz question and format, generate a concise and relevant hint that guides the user towards the correct answer without giving it away directly.

  Question: {{{question}}}
  Format: {{{format}}}

  Ensure the hint is specific to the question and considers the format. Do not mention any brands.
  `,
  config: {
    model: 'googleai/gemini-2.0-flash',
  },
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
