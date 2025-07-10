
'use server';

/**
 * @fileOverview A flow that generates a 5-question quiz on a given cricket topic.
 *
 * - generateQuiz - A function that generates a quiz.
 */
import {ai} from '@/ai/genkit';
import {
    GenerateQuizInput,
    GenerateQuizOutput,
    GenerateQuizInputSchema,
    GenerateQuizOutputSchema,
} from '@/ai/schemas';

export async function generateQuiz(input: GenerateQuizInput): Promise<GenerateQuizOutput> {
  return generateQuizFlow(input);
}

const generalPrompt = ai.definePrompt({
  name: 'generateQuizPrompt',
  input: {schema: GenerateQuizInputSchema},
  output: {schema: GenerateQuizOutputSchema},
  prompt: `Generate 5 challenging multiple-choice quiz questions about "{{format}}" cricket. Also generate 5 interesting, little-known, and engaging facts about the specified cricket format. The questions should be fun and engaging for cricket fans. Focus on interesting statistics, records, and match details. The options should be plausible but with one clear correct answer. The questions must be strictly about the sport and not mention any brands or sponsors.`,
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

const mixedFormatPrompt = ai.definePrompt({
    name: 'generateMixedQuizPrompt',
    input: {schema: GenerateQuizInputSchema},
    output: {schema: GenerateQuizOutputSchema},
    prompt: `Generate a 5-question, challenging multiple-choice quiz with exactly one question from each of the following cricket formats: T20, IPL, WPL, ODI, and Test. Also generate 5 interesting, little-known, and engaging facts, with one fact for each of those formats. The questions should be fun and engaging for cricket fans, focusing on interesting statistics, records, and match details. The options should be plausible but with one clear correct answer. The questions must be strictly about the sport and not mention any brands or sponsors.`,
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

const generateQuizFlow = ai.defineFlow(
  {
    name: 'generateQuizFlow',
    inputSchema: GenerateQuizInputSchema,
    outputSchema: GenerateQuizOutputSchema,
  },
  async input => {
    const promptToUse = input.format === 'Mixed' ? mixedFormatPrompt : generalPrompt;
    const {output} = await promptToUse(input);
    if (!output) {
      throw new Error("The AI failed to generate quiz questions.");
    }
    return output;
  }
);
